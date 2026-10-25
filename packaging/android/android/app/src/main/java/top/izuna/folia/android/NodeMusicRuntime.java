package top.izuna.folia.android;

import android.content.Context;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.TimeUnit;

// A single app-private Node instance. The only socket binds to loopback and requires a random per-process key.
public final class NodeMusicRuntime {
    private static CompletableFuture<Endpoint> startup;
    private static volatile boolean nodeStarted;
    private static volatile String phase = "unpack";
    private static native int startNode(String[] arguments);
    public static final class Endpoint {
        public final int port;
        private final String token;
        Endpoint(int port, String token) { this.port = port; this.token = token; }
    }

    public static synchronized CompletableFuture<Endpoint> ready(Context context) {
        if (startup != null && (!startup.isCompletedExceptionally() || nodeStarted)) return startup;
        Context app = context.getApplicationContext();
        startup = CompletableFuture.supplyAsync(() -> {
            try {
                phase = "unpack";
                File directory = AndroidRuntimeAssets.prepare(app);
                File state = new File(app.getFilesDir(), "music-state");
                if (!state.isDirectory() && !state.mkdirs()) throw new IOException("Service state directory unavailable");
                File readyFile = new File(app.getCacheDir(), "music-" + System.nanoTime() + ".json");
                byte[] random = new byte[32];
                new SecureRandom().nextBytes(random);
                StringBuilder token = new StringBuilder();
                for (byte value : random) token.append(String.format("%02x", value & 255));
                phase = "native-library";
                System.loadLibrary("node");
                System.loadLibrary("folia-node");
                phase = "engine-start";
                Thread engine = new Thread(() -> startNode(new String[] { "node", "--dns-result-order=ipv4first", new File(directory, "main.cjs").getAbsolutePath(), state.getAbsolutePath(), token.toString(), readyFile.getAbsolutePath() }), "FoliaMusicNode");
                engine.setDaemon(true);
                engine.start();
                nodeStarted = true;
                // An individual caller may time out; keep observing this same engine so a later retry can succeed.
                while (engine.isAlive() || readyFile.isFile()) {
                    if (readyFile.isFile()) {
                        JSONObject info; try (InputStream in = new FileInputStream(readyFile)) { info = new JSONObject(new String(readAll(in), StandardCharsets.UTF_8)); }
                        readyFile.delete();
                        phase = "ready";
                        return new Endpoint(info.getInt("port"), token.toString());
                    }
                    File failure = new File(readyFile.getPath() + ".error");
                    if (failure.isFile()) {
                        String code;
                        try (InputStream in = new FileInputStream(failure)) { code = new String(readAll(in), StandardCharsets.UTF_8).trim(); }
                        if (code.matches("[A-Z][A-Z0-9_]{0,63}")) phase = "engine-" + code.toLowerCase(java.util.Locale.ROOT).replace('_', '-');
                        throw new IOException("Built-in music service could not start");
                    }
                    if (!engine.isAlive()) throw new IOException("Built-in music service engine stopped");
                    Thread.sleep(100);
                }
                throw new IOException("Built-in music service engine stopped");
            } catch (Throwable error) {
                throw new RuntimeException("ANDROID_MUSIC_BACKEND_UNAVAILABLE: " + phase + ":" + error.getClass().getSimpleName(), error);
            }
        });
        return startup;
    }

    static String failureReason(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof TimeoutException) return "startup-timeout";
            current = current.getCause();
        }
        return "ready".equals(phase) ? "local-connection" : phase;
    }

    public static HttpURLConnection connect(Context context, String path, String method, Map<String, String> headers, String body) throws Exception {
        if (!path.startsWith("/") || path.startsWith("//") || path.contains("\r") || path.contains("\n")) throw new IOException("Invalid local request path");
        Endpoint endpoint = ready(context).get(80, TimeUnit.SECONDS);
        HttpURLConnection connection = (HttpURLConnection) new URL("http://127.0.0.1:" + endpoint.port + path).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(75000);
        connection.setRequestMethod(method);
        for (Map.Entry<String, String> header : headers.entrySet()) {
            String name = header.getKey().toLowerCase(java.util.Locale.ROOT);
            if (!name.equals("host") && !name.equals("connection") && !name.equals("content-length") && !name.equals("x-folia-local-auth")) connection.setRequestProperty(header.getKey(), header.getValue());
        }
        connection.setRequestProperty("X-Folia-Local-Auth", endpoint.token);
        if (body != null && !method.equals("GET") && !method.equals("HEAD")) {
            connection.setDoOutput(true);
            try (OutputStream out = connection.getOutputStream()) { out.write(body.getBytes(StandardCharsets.UTF_8)); }
        }
        return connection;
    }

    static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        copy(in, out);
        return out.toByteArray();
    }
    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[32768];
        int length;
        while ((length = in.read(buffer)) != -1) out.write(buffer, 0, length);
    }
    private NodeMusicRuntime() {}
}
