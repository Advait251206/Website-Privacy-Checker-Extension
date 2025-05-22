// content.js - Digital Trust Extension (Revised Structure for Robustness - RevG)

// console.log("DigitalTrustExt_Content_RevG: Script Injected. Attempting to attach listener.");

try {
    if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // console.log("DigitalTrustExt_Content_RevG: Message received, Action:", request ? request.action : "NO_ACTION_PROPERTY");

            if (request && request.action === "getPageData_DT") {
                // console.log("DigitalTrustExt_Content_RevG: Handling getPageData_DT.");
                const data = {
                    localStorage: [],
                    sessionStorage: [],
                    localStorageCount: 0,
                    sessionStorageCount: 0,
                    permissions: [],
                    error: null
                };

                try {
                    if (typeof localStorage !== 'undefined') {
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key === null) continue;
                            let itemValue; try { itemValue = localStorage.getItem(key); } catch (e) { itemValue = null; }
                            data.localStorage.push({ key: key, valueSize: itemValue?.length || 0 });
                        }
                        data.localStorageCount = localStorage.length;
                    }

                    if (typeof sessionStorage !== 'undefined') {
                        for (let i = 0; i < sessionStorage.length; i++) {
                            const key = sessionStorage.key(i);
                            if (key === null) continue;
                            let itemValue; try { itemValue = sessionStorage.getItem(key); } catch (e) { itemValue = null; }
                            data.sessionStorage.push({ key: key, valueSize: itemValue?.length || 0 });
                        }
                        data.sessionStorageCount = sessionStorage.length;
                    }

                    const permissionsToCheck = [
                        { name: 'geolocation', label: 'Location', icon: '📍', category: 'sensitive' },
                        { name: 'camera', label: 'Camera', icon: '📷', category: 'sensitive' },
                        { name: 'microphone', label: 'Microphone', icon: '🎤', category: 'sensitive' }
                    ];

                    if (typeof navigator.permissions === 'undefined' || typeof navigator.permissions.query === 'undefined') {
                        data.permissions = permissionsToCheck.map(p => ({ ...p, status: 'unavailable' }));
                        const permErrorMsg = "Permissions API unavailable.";
                        data.error = data.error ? `${data.error}; ${permErrorMsg}` : permErrorMsg;
                        sendResponse(data);
                        return false; // Synchronous path
                    }

                    const permissionPromises = permissionsToCheck.map(p_info =>
                        navigator.permissions.query({ name: p_info.name })
                            .then(status => ({ ...p_info, status: status.state }))
                            .catch(err => ({ ...p_info, status: 'query_failed', errorMsg: err.message }))
                    );

                    Promise.all(permissionPromises)
                        .then(permissions => {
                            data.permissions = permissions;
                            sendResponse(data);
                        })
                        .catch(overallError => {
                            console.error("DigitalTrustExt_Content_RevG: CRITICAL - Promise.all for permissions FAILED:", overallError.message);
                            data.permissions = permissionsToCheck.map(p => ({ ...p, status: 'error', errorMsg: "Promise.all failure" }));
                            const overallPermError = "Overall permissions query failed.";
                            data.error = data.error ? `${data.error}; ${overallPermError}` : overallPermError;
                            sendResponse(data);
                        });
                    
                    return true; // ASYNCHRONOUS response

                } catch (eDataGather) {
                    console.error("DigitalTrustExt_Content_RevG: CRITICAL ERROR during data gathering:", eDataGather.message);
                    data.error = `Content script error: ${eDataGather.message}`;
                    data.localStorage = []; data.localStorageCount = 0;
                    data.sessionStorage = []; data.sessionStorageCount = 0;
                    data.permissions = [];
                    sendResponse(data);
                    return false; // Synchronous path due to error
                }
            } else {
                // Action not handled or request is malformed
                return false; // Or undefined by default
            }
        });
        // console.log("DigitalTrustExt_Content_RevG: Message listener successfully attached.");
    } else {
        console.error("DigitalTrustExt_Content_RevG: CRITICAL - chrome.runtime or onMessage UNDEFINED.");
    }
} catch (eTopLevelSetup) {
    console.error("DigitalTrustExt_Content_RevG: CATASTROPHIC SCRIPT-LEVEL ERROR during setup:", eTopLevelSetup.message);
}