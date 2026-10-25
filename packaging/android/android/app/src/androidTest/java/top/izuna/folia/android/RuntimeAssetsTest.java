package top.izuna.folia.android;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

// Cache retirement may delete only obsolete service code; accounts and retained installations survive.
@RunWith(AndroidJUnit4.class)
public class RuntimeAssetsTest {
    @Test public void retiresOnlyOldCodeWithoutFollowingStateSymlinks() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        File root = new File(context.getCacheDir(), "runtime-assets-test-" + System.nanoTime());
        assertTrue(root.mkdirs());
        File old = new File(root, "music-runtime-000000000001"); assertTrue(old.mkdirs());
        File current = new File(root, "music-runtime-000000000002"); assertTrue(current.mkdirs());
        File state = new File(root, "music-state"); assertTrue(state.mkdirs());
        File account = new File(state, "fixture.json");
        try (FileOutputStream out = new FileOutputStream(account)) { out.write("opaque-local-fixture".getBytes(StandardCharsets.UTF_8)); }
        Files.createSymbolicLink(new File(old, "state-link").toPath(), state.toPath());
        try {
            AndroidRuntimeAssets.retireOldRuntimes(root, current.getName());
            assertFalse(old.exists()); assertTrue(current.isDirectory()); assertTrue(account.isFile());
        } finally { account.delete(); state.delete(); current.delete(); root.delete(); }
    }
    @Test public void completeMarkerAloneDoesNotTrustMissingProviderFiles() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        File root = new File(context.getCacheDir(), "runtime-marker-test-" + System.nanoTime()); assertTrue(root.mkdirs());
        File marker = new File(root, ".complete"); assertTrue(marker.createNewFile());
        try { assertFalse(AndroidRuntimeAssets.installed(root)); }
        finally { marker.delete(); root.delete(); }
    }
}
