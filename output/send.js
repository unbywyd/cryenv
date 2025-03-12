import fetch from "node-fetch";
export function encodeUrlSafeBase64(data) {
    return data
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "~");
}
export async function sendSurveyRequest(type, hash) {
    const apiUrl = `https://tools.webto.pro/api/cryenv/send?type=${encodeURIComponent(type)}&hash=${encodeUrlSafeBase64(hash)}`;
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        console.log("✅ Email sent successfully!");
        return data;
    }
    catch (error) {
        console.error("❌ Failed to send request:", error.message);
    }
}
//# sourceMappingURL=send.js.map