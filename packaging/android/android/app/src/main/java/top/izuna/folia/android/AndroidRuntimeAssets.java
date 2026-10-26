package top.izuna.folia.android;

import android.content.Context;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

// Extract regenerable service code separately from accounts; retire obsolete code before a new install.
final class AndroidRuntimeAssets {
    static File prepare(Context app) throws IOException {
        String digest;
        try (InputStream in = app.getAssets().open("music-backend.sha256")) {
            digest = new String(NodeMusicRuntime.readAll(in), StandardCharsets.UTF_8).trim();
        }
        if (!digest.matches("[a-f0-9]{64}")) throw new IOException("Invalid bundled service digest");
        File files = app.getFilesDir().getCanonicalFile();
        File directory = new File(files, "music-runtime-" + digest.substring(0, 12));
        if (!directory.getAbsolutePath().equals(directory.getCanonicalPath())) throw new IOException("Service directory link is not allowed");
        retireOldRuntimes(files, directory.getName());
        if (installed(directory)) return directory;
        if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException("Service directory unavailable");
        File complete = new File(directory, ".complete");
        if (complete.exists() && !complete.delete()) throw new IOException("Service install marker unavailable");
        String prefix = directory.getCanonicalPath() + File.separator;
        try (ZipInputStream zip = new ZipInputStream(app.getAssets().open("music-backend.zip"))) {
            ZipEntry entry;
            byte[] buffer = new byte[32768];
            while ((entry = zip.getNextEntry()) != null) {
                File target = new File(directory, entry.getName());
                if (!target.getCanonicalPath().startsWith(prefix)) throw new IOException("Invalid backend asset path");
                if (entry.isDirectory()) { target.mkdirs(); continue; }
                target.getParentFile().mkdirs();
                try (OutputStream out = new FileOutputStream(target)) {
                    int length; while ((length = zip.read(buffer)) != -1) out.write(buffer, 0, length);
                }
            }
        }
        if (!complete.createNewFile() || !installed(directory)) throw new IOException("Incomplete service installation");
        return directory;
    }

    static boolean installed(File directory) {
        for (String file : new String[] { ".complete", "main.cjs",
            "node_modules/@neteasecloudmusicapienhanced/api/package.json",
            "node_modules/@yakult-green-tea/qq-music-api/package.json", "node_modules/kugoumusicapi/package.json",
            "node_modules/bodian-music-api/package.json", "node_modules/qishui-music-api/package.json" }) {
            if (!new File(directory, file).isFile()) return false;
        }
        return true;
    }

    static void retireOldRuntimes(File files, String retainedName) throws IOException {
        File[] entries = files.getCanonicalFile().listFiles();
        if (entries == null) return;
        for (File entry : entries) {
            if (!entry.getName().matches("music-runtime-[a-f0-9]{12}") || entry.getName().equals(retainedName)) continue;
            // Do not traverse a symlink or touch music-state, WebView storage, or any user-created directory.
            if (!entry.getAbsolutePath().equals(entry.getCanonicalPath())) continue;
            removeCodeTree(entry);
        }
    }

    private static void removeCodeTree(File entry) throws IOException {
        if (entry.getAbsolutePath().equals(entry.getCanonicalPath())) {
            File[] children = entry.listFiles();
            if (children != null) for (File child : children) removeCodeTree(child);
        }
        entry.delete();
    }
}
