import { app, BrowserWindow } from "electron";
function getWebRendererUrl() {
    return process.env.VIERIFY_WEB_URL ?? "http://localhost:3000";
}
async function createWindow() {
    const window = new BrowserWindow({
        height: 720,
        title: "Vierify Merchant",
        width: 1080
    });
    await window.loadURL(getWebRendererUrl());
}
await app.whenReady();
await createWindow();
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
