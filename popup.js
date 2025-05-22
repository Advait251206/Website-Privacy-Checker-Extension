// popup.js - Digital Trust Extension (COMPLETE AND FULLY DEFINED)

console.log("DigitalTrustExt_Popup_FINAL: Script Loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DigitalTrustExt_Popup_FINAL: DOMContentLoaded.");

    function getElem(id, critical = false) {
        const el = document.getElementById(id);
        if (!el && critical) {
            console.error(`DigitalTrustExt_Popup: CRITICAL - Element with ID '${id}' not found!`);
        }
        return el;
    }
    function querySel(selector, parent = document, critical = false) {
        const el = parent.querySelector(selector);
        if (!el && critical && parent) {
            console.error(`DigitalTrustExt_Popup: CRITICAL - Element for selector '${selector}' in parent '${parent.id || parent.tagName || 'document'}' not found!`);
        }
        return el;
     }
    function querySelAll(selector, parent = document, critical = false) {
        const els = parent.querySelectorAll(selector);
        if (els.length === 0 && critical && parent && parent.id !== 'mainContent' && parent.id !== 'loadingMessage' ) {
            // console.error(`DigitalTrustExt_Popup: CRITICAL - No elements for selector '${selector}' in parent '${parent.id || parent.tagName}'`);
        }
        return els;
     }

    const loadingMessageEl = getElem('loadingMessage');
    const errorMessageEl = getElem('errorMessage');
    const mainContentEl = getElem('mainContent', true);
    const siteInfoEl = getElem('siteInfo');
    const privacyScoreValueEl = getElem('privacyScoreValue');
    const privacyScoreRemarkEl = getElem('privacyScoreRemark');
    const actionableAdviceBoxEl = getElem('actionableAdviceBox');
    const adviceListEl = getElem('adviceList');
    const maxScoreReachedEl = getElem('maxScoreReached');

    const permissionsSectionEl = getElem('permissionsSection');
    const permTabsContainer = permissionsSectionEl ? querySel('.dt-tabs', permissionsSectionEl) : null;
    const permTabButtons = permissionsSectionEl ? querySelAll('.dt-tab-button[data-tab]', permissionsSectionEl) : [];
    const permListAllowedEl = getElem('permissionListAllowed');
    const permListAskEl = getElem('permissionListAsk');
    const permListBlockedEl = getElem('permissionListBlocked');
    const permAllowedCountEl = getElem('permAllowedCount');
    const permAskCountEl = getElem('permAskCount');
    const permBlockedCountEl = getElem('permBlockedCount');
    const permissionsUnavailableMsgEl = getElem('permissionsUnavailableMsg');
    const permOverallCountEl = getElem('permissionOverallCount');

    const connectionsSectionEl = getElem('connectionsSection');
    const connTabsContainer = connectionsSectionEl ? querySel('.dt-tabs', connectionsSectionEl) : null;
    const connTabButtons = connectionsSectionEl ? querySelAll('.dt-tab-button[data-conn-tab]', connectionsSectionEl) : [];
    const connListTrackersEl = getElem('connectionListTrackers');
    const connListOtherExternalEl = getElem('connectionListOtherExternal');
    const connTrackersCountEl = getElem('connTrackersCount');
    const connOtherExternalCountEl = getElem('connOtherExternalCount');
    const connectionsUnavailableMsgEl = getElem('connectionsUnavailableMsg');
    const connOverallCountEl = getElem('connectionOverallCount');

    let effectiveMainFrameHostnameForConnections = '';

    const KNOWN_TRACKER_DOMAIN_FRAGMENTS = [
        'google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'analytics.google.',
        'facebook.net', 'connect.facebook.net', 'googlesyndication.com', 'graph.facebook.com',
        'scorecardresearch.com', 'krxd.net', 'adsrvr.org', 'criteo.com', 'rubiconproject.com',
        'matomo.org', 'piwik.pro', 'hotjar.com', 'optimizely.com', 'adroll.com', 'quantserve.com',
        'amazon-adsystem.com', 'pubmatic.com', 'openx.net', 'sharethrough.com', 'taboola.com',
        'outbrain.com', 'chartbeat.com', 'clicktale.net', 'casalemedia.com', 'yieldoptimizer.com',
        'rlcdn.com', 'media.net', 'adform.net', 'smartadserver.com', 'adobedtm.com', 'demdex.net'
    ];

    function isKnownTracker(domain) {
        if (!domain) return false;
        const lowerDomain = domain.toLowerCase();
        return KNOWN_TRACKER_DOMAIN_FRAGMENTS.some(fragment => lowerDomain.includes(fragment));
    }
    function getBaseDomain(hostname) {
        if (!hostname) return null;
        const parts = hostname.split('.').reverse();
        if (parts.length >= 2) {
            if (['com', 'net', 'org', 'gov', 'edu', 'co', 'info', 'biz', 'io', 'app', 'dev', 'me', 'tv', 'xyz', 'tech', 'ai', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'nl', 'br', 'in', 'ru', 'it', 'es', 'se'].includes(parts[1]) && parts.length > 2) {
                return parts[2] + '.' + parts[1] + '.' + parts[0];
            }
            return parts[1] + '.' + parts[0];
        }
        return hostname;
    }

    function initializeTabs(tabButtonsNodeList, buttonAttribute) {
        if (!tabButtonsNodeList || tabButtonsNodeList.length === 0) return;
        tabButtonsNodeList.forEach(button => {
            button.addEventListener('click', () => {
                const parentSection = button.closest('.dt-section');
                if (!parentSection) return;
                const currentButtons = querySelAll(`button[${buttonAttribute}]`, parentSection);
                const currentContents = querySelAll('.dt-tab-content', parentSection);
                currentButtons.forEach(btn => btn.classList.remove('active'));
                currentContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                const tabIdValue = button.getAttribute(buttonAttribute);
                const activeContent = querySel(`.dt-tab-content#${tabIdValue}`, parentSection);
                if (activeContent) activeContent.classList.add('active');
            });
        });
    }

    function setupCollapsibleSections() {
        const sectionHeaders = querySelAll('.dt-section-header');
        sectionHeaders.forEach(header => {
            const section = header.parentElement;
            const toggleIcon = querySel('.toggle-icon', header);
            if (!section || !toggleIcon) return;
            header.addEventListener('click', () => {
                section.classList.toggle('collapsed');
                toggleIcon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                checkEmptySections();
            });
        });
    }
    
    function showError(message) {
        console.error("DigitalTrustExt_Popup_FINAL: showError called - ", message);
        if (loadingMessageEl) loadingMessageEl.style.display = 'none';
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
            errorMessageEl.style.display = 'block';
        }
        if (mainContentEl) mainContentEl.style.display = 'none';
        if (typeof updatePrivacyScore === "function" && privacyScoreValueEl && privacyScoreRemarkEl && actionableAdviceBoxEl && maxScoreReachedEl) {
             updatePrivacyScore('--', "Error analyzing page.", "#F44336", ["Could not perform analysis due to an error."]);
             if(actionableAdviceBoxEl) actionableAdviceBoxEl.style.display = 'block';
             if(maxScoreReachedEl) maxScoreReachedEl.style.display = 'none';
        } else {
            if(privacyScoreValueEl) privacyScoreValueEl.textContent = '--';
            if(privacyScoreRemarkEl) privacyScoreRemarkEl.textContent = "Error analyzing page.";
        }
    }

    function createListItem(icon, name, detailHtml = '', value = null) {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="dt-item-icon">${icon}</span>
            <span class="dt-item-name">${name}</span>
            ${detailHtml ? `<span class="dt-item-detail">${detailHtml}</span>` : ''}
            ${value ? `<span class="dt-item-value">${value}</span>` : ''}
        `;
        return li;
    }

    function createPermissionListItem(permission) {
        const li = document.createElement('li');
        li.classList.add('dt-permission-item');
        let statusText = permission.status ? permission.status.charAt(0).toUpperCase() + permission.status.slice(1) : "Unknown";
        if (permission.status === 'query_failed') statusText = "Query Failed";
        if (permission.status === 'unavailable') statusText = "API N/A";
        const statusClass = `status-${permission.status ? permission.status.toLowerCase() : 'unknown'}`;
        let detailText = `(${statusText})`;
        let tooltipText = `Status: ${statusText}.`;
        if(permission.errorMsg) tooltipText += ` ${permission.errorMsg}`;
        if (permission.status === 'granted') tooltipText = "Site has this permission. Manage in browser settings.";
        else if (permission.status === 'denied') tooltipText = "Access denied. Manage in browser settings.";
        else if (permission.status === 'prompt') tooltipText = "Site will ask when needed.";
        else if (permission.status === 'query_failed') tooltipText = "Could not check status. " + (permission.errorMsg || "");
        else if (permission.status === 'unavailable') tooltipText = "Permissions API unavailable here.";

        li.innerHTML = `
            <span class="dt-item-icon">${permission.icon}</span>
            <span class="dt-item-name">${permission.name}</span>
            <span class="dt-item-detail ${statusClass}">${detailText}</span>
            <span class="dt-tooltip"><span style="font-size:0.8em; margin-left:5px; color:#666;">❔</span><span class="dt-tooltiptext">${tooltipText}</span></span>
        `;
        return li;
    }
    
    // --- Populate Functions (numerical counts, tab logic) ---
    function populateCookies(cookies, pageTopLevelDomain) {
        const listEl = getElem('cookieList'); const countEl = getElem('cookieCount');
        if (!listEl || !countEl) return 0; listEl.innerHTML = '';
        if (!Array.isArray(cookies)) cookies = [];
        let cookieLength = cookies.length;
        countEl.textContent = cookieLength;
        let thirdPartyCookieCount = 0;
        if (cookieLength === 0) { return thirdPartyCookieCount; }
        cookies.forEach(cookie => {
            const cEffDom = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
            const cTld = getBaseDomain(cEffDom);
            const is3P = pageTopLevelDomain && cTld && (cTld !== pageTopLevelDomain);
            if (is3P) thirdPartyCookieCount++;
            let dHtml = `(Domain: ${cookie.domain})`;
            if (is3P) dHtml += ` <span class="dt-text-third-party">[3rd Party]</span>`;
            if (isKnownTracker(cookie.domain) || isKnownTracker(cookie.name)) dHtml += ` <span class="dt-text-tracker">[Tracker?]</span>`;
            listEl.appendChild(createListItem('🍪', cookie.name, dHtml));
        });
        return thirdPartyCookieCount;
    }
    
    function populateConnections(domains, pageTopLevelDomain, currentTabExactHostname) {
        if (!connListTrackersEl || !connListOtherExternalEl || !connTrackersCountEl || !connOtherExternalCountEl || !connOverallCountEl || !connectionsUnavailableMsgEl) {
            if(connOverallCountEl) connOverallCountEl.textContent = "Err";
            return { trackers: 0, external: 0 };
        }
        connListTrackersEl.innerHTML = ''; connListOtherExternalEl.innerHTML = '';
        const trackerTabEmptyMsg = connListTrackersEl.parentElement?.querySelector('.dt-empty-message.tab-empty');
        const otherExtTabEmptyMsg = connListOtherExternalEl.parentElement?.querySelector('.dt-empty-message.tab-empty');
        if(trackerTabEmptyMsg) trackerTabEmptyMsg.style.display = 'none';
        if(otherExtTabEmptyMsg) otherExtTabEmptyMsg.style.display = 'none';
        if(connectionsUnavailableMsgEl) connectionsUnavailableMsgEl.style.display = 'none';
        if(connTabsContainer) connTabsContainer.style.display = 'flex';

        if (!Array.isArray(domains)) domains = [];
        let trackersListContent = []; let otherExternalListContent = [];
        const uniqueDomainsAll = Array.from(new Set(domains.filter(d => d)));
        uniqueDomainsAll.forEach(domain => {
            if (!domain) return;
            const dBase = getBaseDomain(domain);
            const isEffectivelyExternal = domain !== currentTabExactHostname && 
                                      dBase !== pageTopLevelDomain && 
                                      domain !== effectiveMainFrameHostnameForConnections;
            if (isEffectivelyExternal) {
                const isTrk = isKnownTracker(domain);
                const detailHtml = `<span class="dt-text-external">[External]</span> ${isTrk ? '<span class="dt-text-tracker">[Likely Tracker]</span>' : ''}`;
                if (isTrk) trackersListContent.push({domain, detailHtml});
                else otherExternalListContent.push({domain, detailHtml});
            }
        });
        trackersListContent.forEach(item => connListTrackersEl.appendChild(createListItem('🔗', item.domain, item.detailHtml)));
        otherExternalListContent.forEach(item => connListOtherExternalEl.appendChild(createListItem('🔗', item.domain, item.detailHtml)));
        if(connTrackersCountEl) connTrackersCountEl.textContent = trackersListContent.length;
        if(connOtherExternalCountEl) connOtherExternalCountEl.textContent = otherExternalListContent.length;
        if(connOverallCountEl) connOverallCountEl.textContent = trackersListContent.length + otherExternalListContent.length;
        if (trackersListContent.length === 0 && trackerTabEmptyMsg) trackerTabEmptyMsg.style.display = 'block';
        if (otherExternalListContent.length === 0 && otherExtTabEmptyMsg) otherExtTabEmptyMsg.style.display = 'block';
        if (trackersListContent.length === 0 && otherExternalListContent.length === 0 && connectionsUnavailableMsgEl ) {
             if (domains.length > 0 && uniqueDomainsAll.length > 0 && !uniqueDomainsAll.some(d => d !== currentTabExactHostname && getBaseDomain(d) !== pageTopLevelDomain && d !== effectiveMainFrameHostnameForConnections) ) {
                connectionsUnavailableMsgEl.textContent = 'No external connections or trackers identified (all connections seem first-party).';
             } else {
                connectionsUnavailableMsgEl.textContent = 'No connection data loaded.';
             }
             connectionsUnavailableMsgEl.style.display = 'block';
             if(connTabsContainer) connTabsContainer.style.display = 'none';
        }
        return { trackers: trackersListContent.length, external: otherExternalListContent.length };
    }

    function populateStorage(lsDataIn, ssDataIn, pageData) {
        const lsListEl = getElem('localStorageList'); const ssListEl = getElem('sessionStorageList');
        const countEl = getElem('storageCount'); const emptyMsg = getElem('storageEmptyMessage');
        if(!lsListEl || !ssListEl || !countEl) return 0;
        lsListEl.innerHTML = ''; ssListEl.innerHTML = ''; let totalItems = 0;
        const lsData = (pageData && pageData.localStorage) || []; const ssData = (pageData && pageData.sessionStorage) || [];
        const lsCount = (pageData && pageData.localStorageCount) || 0; const ssCount = (pageData && pageData.sessionStorageCount) || 0;
        totalItems = lsCount + ssCount;
        countEl.textContent = totalItems;
        lsData.forEach(item => lsListEl.appendChild(createListItem('📦', item.key, `(Local)`, `~${Math.ceil((item.valueSize||0)/1024)}KB`)));
        ssData.forEach(item => ssListEl.appendChild(createListItem('📦', item.key, `(Session)`, `~${Math.ceil((item.valueSize||0)/1024)}KB`)));
        if(emptyMsg) emptyMsg.style.display = totalItems === 0 && lsListEl.children.length === 0 && ssListEl.children.length === 0 ? 'block' : 'none';
         if (lsListEl.children.length === 0 && ssListEl.children.length === 0 && totalItems > 0 && emptyMsg && (emptyMsg.style.display === 'none' || emptyMsg.style.display === '')) {
            emptyMsg.textContent = `Found ${totalItems} storage items (details limited).`; emptyMsg.style.display = 'block';
        }
        return totalItems;
    }
    
    function populatePermissions(permissionsFromContent) {
        if (!permListAllowedEl || !permListAskEl || !permListBlockedEl || !permAllowedCountEl || !permAskCountEl || !permBlockedCountEl || !permOverallCountEl || !permissionsUnavailableMsgEl || !permTabsContainer) {
            if(permOverallCountEl) permOverallCountEl.textContent = "Error";
            return { granted: [], prompt: [] };
        }
        permListAllowedEl.innerHTML = ''; permListAskEl.innerHTML = ''; permListBlockedEl.innerHTML = '';
        querySelAll('.dt-empty-message.tab-empty', permissionsSectionEl).forEach(el => el.style.display = 'none');
        if(permissionsUnavailableMsgEl) permissionsUnavailableMsgEl.style.display = 'none';
        if(permTabsContainer) permTabsContainer.style.display = 'flex';

        let grantedPerms = []; let promptPerms = [];
        const permissions = permissionsFromContent || [];
        if (permissions.length === 0 && permissionsFromContent === null) {
            if(permOverallCountEl) permOverallCountEl.textContent = 'N/A';
            if(permTabsContainer) permTabsContainer.style.display = 'none';
            if(permissionsUnavailableMsgEl) { permissionsUnavailableMsgEl.textContent = 'Permission data could not be loaded.'; permissionsUnavailableMsgEl.style.display = 'block';}
            return { granted: [], prompt: [] };
        }
        let grantedCount = 0, askCount = 0, blockedCount = 0;
        permissions.forEach(p => {
            const listItem = createPermissionListItem(p);
            if (p.status === 'granted') {
                permListAllowedEl.appendChild(listItem); grantedCount++;
                if (p.category === 'sensitive') grantedPerms.push(p.name);
            } else if (p.status === 'prompt') {
                permListAskEl.appendChild(listItem); askCount++;
                if (p.category === 'sensitive') promptPerms.push(p.name);
            } else if (p.status === 'denied') {
                permListBlockedEl.appendChild(listItem); blockedCount++;
            } else {
                const note = document.createElement('span'); note.style.fontSize='0.8em'; note.style.marginLeft='5px'; note.textContent=`(${p.status})`;
                const detailSpan = listItem.querySelector('.dt-item-detail');
                if(detailSpan) detailSpan.appendChild(note); else listItem.appendChild(note);
                permListAskEl.appendChild(listItem); askCount++;
            }
        });
        if(permAllowedCountEl) permAllowedCountEl.textContent = grantedCount;
        if(permAskCountEl) permAskCountEl.textContent = askCount;
        if(permBlockedCountEl) permBlockedCountEl.textContent = blockedCount;
        if(permOverallCountEl) permOverallCountEl.textContent = grantedPerms.length + promptPerms.length;

        const allowedTabEmptyMsg = permListAllowedEl.parentElement?.querySelector('.dt-empty-message.tab-empty');
        const askTabEmptyMsg = permListAskEl.parentElement?.querySelector('.dt-empty-message.tab-empty');
        const blockedTabEmptyMsg = permListBlockedEl.parentElement?.querySelector('.dt-empty-message.tab-empty');
        if (grantedCount === 0 && allowedTabEmptyMsg) allowedTabEmptyMsg.style.display = 'block';
        if (askCount === 0 && askTabEmptyMsg) askTabEmptyMsg.style.display = 'block';
        if (blockedCount === 0 && blockedTabEmptyMsg) blockedTabEmptyMsg.style.display = 'block';
        
        if (grantedCount === 0 && askCount === 0 && blockedCount === 0 && permissions.length > 0 && permissionsUnavailableMsgEl) {
             permissionsUnavailableMsgEl.textContent = 'No permissions in standard categories. Statuses might be unavailable or errored (check "Ask" tab).';
             permissionsUnavailableMsgEl.style.display = 'block';
        } else if (permissions.length === 0 && permissionsFromContent !== null && permOverallCountEl) {
             permOverallCountEl.textContent = "0";
             if (allowedTabEmptyMsg) allowedTabEmptyMsg.style.display = 'block';
             if (askTabEmptyMsg) askTabEmptyMsg.style.display = 'block';
             if (blockedTabEmptyMsg) blockedTabEmptyMsg.style.display = 'block';
        }
        return { granted: grantedPerms, prompt: promptPerms };
    }
    
    // Score calculation and UI update functions
    function calculateAndDisplayPrivacyScore(data, contentError) {
        let currentScore = 100;
        let remarks = [];
        let adviceItems = [];
        let totalPossibleIncrease = 0;

        if(contentError && !remarks.some(r => r.includes("Partial"))) remarks.push("Partial data analysis.");

        const thirdPartyCookiePenalty = Math.min(data.thirdPartyCookies * 2, 20);
        if (data.thirdPartyCookies > 0) {
            currentScore -= thirdPartyCookiePenalty;
            adviceItems.push("Manage third-party cookies via browser settings/extensions. (Potential gain: ~" + thirdPartyCookiePenalty + "pts)");
            totalPossibleIncrease += thirdPartyCookiePenalty;
        }
        if (data.thirdPartyCookies > 3) remarks.push("Many 3rd-party cookies.");

        const trackerPenalty = Math.min(data.identifiedTrackers * 5, 30);
        if(data.identifiedTrackers > 0){
            currentScore -= trackerPenalty;
            adviceItems.push("Using a tracker blocker can reduce tracking. (Potential gain: ~" + trackerPenalty + "pts)");
            totalPossibleIncrease += trackerPenalty;
        }
        if (data.identifiedTrackers > 2) remarks.push("Significant trackers found.");
        else if (data.identifiedTrackers > 0 && !remarks.some(r => r.includes("tracker"))) remarks.push("Some trackers present.");

        const externalPenalty = Math.min(data.externalConnections * 1, 10);
        if(data.externalConnections > 0) currentScore -= externalPenalty;
        if (data.externalConnections > 5 && data.identifiedTrackers === 0 && !remarks.some(r=>r.includes("external"))) remarks.push("Numerous external links.");

        const storagePenalty = data.storageItems > 5 ? Math.min(Math.floor((data.storageItems - 5) / 3) * 2, 10) : 0;
        if(storagePenalty > 0) currentScore -= storagePenalty;
        if (data.storageItems > 10 && !remarks.some(r=>r.includes("storage"))) remarks.push("High browser storage usage.");

        (data.permissionsGranted || []).forEach(perm => {
            let penalty = 0;
            if (perm === 'Camera' || perm === 'Microphone') { penalty = 15; remarks.push(`${perm} GRANTED!`); }
            else if (perm === 'Location') { penalty = 10; remarks.push("Location GRANTED."); }
            if (penalty > 0) {
                 currentScore -= penalty;
                 adviceItems.push(`Revoke '${perm}' permission in browser settings if not vital. (Gain: ${penalty}pts)`);
                 totalPossibleIncrease += penalty;
            }
        });
        (data.permissionsPrompt || []).forEach(perm => {
            let penalty = 0;
            if (perm === 'Camera' || perm === 'Microphone') { penalty = 7; remarks.push(`May request ${perm}.`); }
            else if (perm === 'Location') { penalty = 5; remarks.push("May request Location."); }
            if (penalty > 0) {
                 currentScore -= penalty;
                 adviceItems.push(`Be mindful if '${perm}' access is requested; deny if not needed.`);
            }
        });

        currentScore = Math.max(0, currentScore);
        data.totalPossibleScoreIncrease = totalPossibleIncrease;

        let remarkText = remarks.length > 0 ? remarks.join(" ") : "Generally appears okay.";
        if (remarks.length === 0 && currentScore === 100 && !contentError) remarkText = "Looking good! Excellent privacy practices detected.";
        if (remarkText.length > 70 && remarks.length > 1) remarkText = remarks.slice(0, remarks.length > 2 ? 2 : 1).join(" ") + (remarks.length > (remarks.length > 2 ? 2 : 1) ? "..." : "");
        else if (remarkText.length > 90) remarkText = remarkText.substring(0, 87) + "...";

        let scoreColor = "#4CAF50";
        if (currentScore < 50) { scoreColor = "#F44336"; if ((remarks.length==0 || remarks.every(r=>r.includes("Partial data analysis."))) && !contentError ) remarkText="Caution: Low score.";}
        else if (currentScore < 75) { scoreColor = "#FFC107"; if ((remarks.length==0 || remarks.every(r=>r.includes("Partial data analysis."))) && !contentError ) remarkText="Review for concerns.";}
        
        updatePrivacyScore(currentScore, remarkText, scoreColor, adviceItems, data.totalPossibleScoreIncrease);
    }

    function updatePrivacyScore(score, remark, scoreValColor, adviceItems = [], possibleGain = 0) {
        if(privacyScoreValueEl) privacyScoreValueEl.textContent = score;
        if(privacyScoreValueEl) privacyScoreValueEl.style.color = scoreValColor;
        if(privacyScoreRemarkEl) privacyScoreRemarkEl.textContent = remark;

        if (privacyScoreRemarkEl) {
            if (score < 50) privacyScoreRemarkEl.style.color = scoreValColor;
            else if (score < 75) privacyScoreRemarkEl.style.color = scoreValColor;
            else privacyScoreRemarkEl.style.color = "";
        }

        if (!actionableAdviceBoxEl || !adviceListEl || !maxScoreReachedEl) return;

        adviceListEl.innerHTML = '';
        if (adviceItems.length > 0) {
            adviceItems.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                adviceListEl.appendChild(li);
            });
            actionableAdviceBoxEl.style.display = 'block';
            maxScoreReachedEl.style.display = 'none';
        } else if (score >= 95 && possibleGain < 5 && !remark.includes("Partial")) {
            actionableAdviceBoxEl.style.display = 'block';
            maxScoreReachedEl.style.display = 'block';
            adviceListEl.innerHTML = '';
        } else if (adviceItems.length === 0 && score < 95 && !remark.includes("Partial") ) {
            const li = document.createElement('li');
            li.textContent = "Site follows good practices. Advanced users might explore stricter browser settings.";
            adviceListEl.appendChild(li);
            actionableAdviceBoxEl.style.display = 'block';
            maxScoreReachedEl.style.display = 'none';
        } else if (remark.includes("Partial") && adviceItems.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Analysis incomplete. Score may not be fully representative.";
            adviceListEl.appendChild(li);
            actionableAdviceBoxEl.style.display = 'block';
            maxScoreReachedEl.style.display = 'none';
        } else {
            actionableAdviceBoxEl.style.display = 'none';
        }
    }

    function checkEmptySections() {
        querySelAll('.dt-section').forEach(section => {
            const content = querySel('.dt-section-content', section);
            const explanation = querySel('.dt-explanation', section);
            // Use a more specific selector for general empty messages that are direct children of content
            const generalEmptyMsgForSection = querySel(':scope > .dt-empty-message:not(.tab-empty):not(.main-perm-empty):not(.main-conn-empty)', content);
            let isEffectivelyEmpty = true;

            if (content) {
                if (section.id === 'permissionsSection' || section.id === 'connectionsSection') {
                    const tabContentULs = querySelAll('.dt-tab-content ul', section);
                    isEffectivelyEmpty = Array.from(tabContentULs).every(ul => !ul || ul.children.length === 0);
                    
                    const mainTabbedEmptyMsg = querySel('.dt-empty-message.main-perm-empty, .dt-empty-message.main-conn-empty', section);
                    if(mainTabbedEmptyMsg) {
                         const hasActiveError = querySel('.dt-error-message.tab-error', content);
                         mainTabbedEmptyMsg.style.display = (isEffectivelyEmpty && !hasActiveError) ? 'block' : 'none';
                    }
                } else {
                    const uls = querySelAll('ul', content);
                    if (uls.length > 0) {
                        isEffectivelyEmpty = Array.from(uls).every(ul => !ul || ul.children.length === 0);
                    } else {
                        isEffectivelyEmpty = !Array.from(content.children).some(child =>
                            !child.classList.contains('dt-explanation') &&
                            !child.classList.contains('dt-empty-message') && // General section empty message
                            !child.classList.contains('dt-error-message') && // Exclude error messages from making it "not empty"
                            child.textContent.trim() !== ''
                        );
                    }
                }
            }
            
            if (explanation) {
                let shouldShowExplanation = !isEffectivelyEmpty;
                // For tabbed sections, also show explanation if ANY tab has content
                if (section.id === 'permissionsSection' || section.id === 'connectionsSection') {
                    const anyTabHasContent = Array.from(querySelAll('.dt-tab-content ul', section)).some(ul => ul && ul.children.length > 0);
                    shouldShowExplanation = anyTabHasContent;
                } else { // For non-tabbed, check its own ULs
                    const ulLists = querySelAll('ul', content);
                    shouldShowExplanation = Array.from(ulLists).some(ul => ul && ul.children.length > 0);
                }
                explanation.style.display = section.classList.contains('collapsed') ? 'none' : (shouldShowExplanation ? 'block' : 'none');
            }


            if (generalEmptyMsgForSection && section.id !== 'permissionsSection' && section.id !== 'connectionsSection') {
                 generalEmptyMsgForSection.style.display = section.classList.contains('collapsed') ? 'none' : (isEffectivelyEmpty ? 'block' : 'none');
            }
            if (section.id === 'storageSection') {
                const storageEmptyMsgDiv = getElem('storageEmptyMessage');
                if (storageEmptyMsgDiv) {
                    const lsList = getElem('localStorageList');
                    const ssList = getElem('sessionStorageList');
                    const storageIsEmpty = (!lsList || lsList.children.length === 0) && (!ssList || ssList.children.length === 0);
                    storageEmptyMsgDiv.style.display = section.classList.contains('collapsed') ? 'none' : (storageIsEmpty ? 'block' : 'none');
                }
            }
        });
    }


    // --- Main Data Fetching Logic wrapped in try-catch ---
    try {
        if(loadingMessageEl) loadingMessageEl.style.display = 'block';
        if(errorMessageEl) errorMessageEl.style.display = 'none';
        if(mainContentEl) mainContentEl.style.display = 'none';
        if(siteInfoEl) siteInfoEl.textContent = 'Initializing...';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                showError("Error querying tabs: " + chrome.runtime.lastError.message);
                console.error("DigitalTrustExt_Popup_Corrected_v2: chrome.runtime.lastError in tabs.query:", chrome.runtime.lastError);
                initializeTabs(permTabButtons, 'data-tab'); initializeTabs(connTabButtons, 'data-conn-tab'); setupCollapsibleSections();
                return;
            }
            if (!tabs || tabs.length === 0 || !tabs[0] || !tabs[0].id || !tabs[0].url) {
                showError("Could not get valid active tab information.");
                updatePrivacyScore(0, "Error determining score.", "#F44336", []);
                initializeTabs(permTabButtons, 'data-tab'); initializeTabs(connTabButtons, 'data-conn-tab'); setupCollapsibleSections();
                return;
            }
            const currentTab = tabs[0];
            if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
                if(siteInfoEl) siteInfoEl.innerHTML = `<span class="dt-item-icon">🛡️</span> Special Page`;
                showError(`Analysis not available for special browser pages like '${currentTab.url.substring(0,30)}...'`);
                updatePrivacyScore(100, "Not applicable.", "#4CAF50", ["No analysis on special pages."]);
                if (mainContentEl) mainContentEl.style.display = 'block'; 
                if (loadingMessageEl) loadingMessageEl.style.display = 'none';
                initializeTabs(permTabButtons, 'data-tab'); initializeTabs(connTabButtons, 'data-conn-tab');
                setupCollapsibleSections(); checkEmptySections(); 
                return;
            }
            
            try {
                if(siteInfoEl) siteInfoEl.innerHTML = `Inspecting: <strong>${new URL(currentTab.url).hostname}</strong>`;
                effectiveMainFrameHostnameForConnections = new URL(currentTab.url).hostname.replace(/^www\./, '');
            } catch (e) {
                showError("Invalid page URL.");
                initializeTabs(permTabButtons, 'data-tab'); initializeTabs(connTabButtons, 'data-conn-tab'); setupCollapsibleSections(); 
                return;
            }

            Promise.allSettled([
                chrome.cookies.getAll({ url: currentTab.url }),
                chrome.runtime.sendMessage({ action: "getTabInfo_DT", tabId: currentTab.id }),
                chrome.tabs.sendMessage(currentTab.id, { action: "getPageData_DT" })
            ]).then((results) => {
                if (loadingMessageEl) loadingMessageEl.style.display = 'none';
                if (mainContentEl) mainContentEl.style.display = 'block';

                try {
                    const [cookiesResult, tabInfoResult, pageDataResult] = results;
                    let fetchedCookies = [];
                    if (cookiesResult.status === 'fulfilled' && cookiesResult.value) fetchedCookies = cookiesResult.value;
                    else if (cookiesResult.status === 'rejected') console.error("DigitalTrustExt_Popup_Corrected_v2: Cookie fetch error:", cookiesResult.reason);

                    let fetchedTabInfo = { domains: [], mainFrameDomain: null };
                    if (tabInfoResult.status === 'fulfilled' && tabInfoResult.value) fetchedTabInfo = tabInfoResult.value;
                    else if (tabInfoResult.status === 'rejected') console.error("DigitalTrustExt_Popup_Corrected_v2: TabInfo fetch error:", tabInfoResult.reason);
                    
                    const mainFrameFromBG = fetchedTabInfo.mainFrameDomain;
                    const currentTabHostnameFromURL = new URL(currentTab.url).hostname.replace(/^www\./, '');
                    const effectiveMainHostname = mainFrameFromBG || currentTabHostnameFromURL;
                    effectiveMainFrameHostnameForConnections = effectiveMainHostname;
                    const pageTopLevelDomain = getBaseDomain(effectiveMainHostname);

                    let fetchedPageData = null;
                    let contentScriptErrorMsg = null;
                    if (pageDataResult.status === 'fulfilled' && pageDataResult.value) {
                        fetchedPageData = pageDataResult.value;
                        if (fetchedPageData && fetchedPageData.error) contentScriptErrorMsg = "Content Script: " + fetchedPageData.error;
                    } else if (pageDataResult.status === 'rejected') {
                        contentScriptErrorMsg = "Page Data Error: " + pageDataResult.reason.message;
                        console.error("DigitalTrustExt_Popup_Corrected_v2: PageData fetch error (sendMessage FAILED):", pageDataResult.reason);
                         const pageDataErrorDiv = document.createElement('div');
                         pageDataErrorDiv.className = 'dt-error-message tab-error';
                         pageDataErrorDiv.textContent = `Failed to get page data: ${pageDataResult.reason.message}. Content script may have issues.`;
                         const permContentParent = getElem('permissionsSection')?.querySelector('.dt-section-content');
                         if (permContentParent && !permContentParent.querySelector('.dt-error-message.tab-error')) {
                           permContentParent.prepend(pageDataErrorDiv.cloneNode(true));
                         } else if (permissionsUnavailableMsgEl) { // This check should happen if permContentParent isn't found too.
                            permissionsUnavailableMsgEl.textContent = pageDataErrorDiv.textContent;
                            permissionsUnavailableMsgEl.style.display = 'block';
                            if(permTabsContainer) permTabsContainer.style.display = 'none';
                        }
                    }

                    let collectedData = {
                        thirdPartyCookies: 0, identifiedTrackers: 0, externalConnections: 0,
                        storageItems: 0, permissionsGranted: [], permissionsPrompt: [],
                        totalPossibleScoreIncrease: 0
                    };
                    
                    collectedData.thirdPartyCookies = populateCookies(fetchedCookies, pageTopLevelDomain);
                    const connInfo = populateConnections(fetchedTabInfo.domains || [], pageTopLevelDomain, effectiveMainFrameHostnameForConnections);
                    collectedData.identifiedTrackers = connInfo.trackers;
                    collectedData.externalConnections = connInfo.external;
                    collectedData.storageItems = populateStorage(fetchedPageData ? fetchedPageData.localStorage : [], fetchedPageData ? fetchedPageData.sessionStorage : [], fetchedPageData);
                    const permCategorizedInfo = populatePermissions(fetchedPageData ? fetchedPageData.permissions : null);
                    collectedData.permissionsGranted = permCategorizedInfo.granted;
                    collectedData.permissionsPrompt = permCategorizedInfo.prompt;
                    
                    initializeTabs(permTabButtons, 'data-tab');
                    initializeTabs(connTabButtons, 'data-conn-tab');
                    setupCollapsibleSections();
                    checkEmptySections();
                    calculateAndDisplayPrivacyScore(collectedData, contentScriptErrorMsg);

                } catch (eProcessing) {
                    console.error("DigitalTrustExt_Popup_Corrected_v2: Error processing promise results or populating UI:", eProcessing, eProcessing.stack);
                    showError("Error displaying data: " + eProcessing.message);
                }
            });
        });
    } catch (eOuterQuery) {
        console.error("DigitalTrustExt_Popup_Corrected_v2: Error setting up chrome.tabs.query:", eOuterQuery, eOuterQuery.stack);
        showError("Initialization failed: Tab query error.");
    }
    
    // console.log("DigitalTrustExt_Popup_Corrected_v2: DOMContentLoaded handler finished.");
}); // End of DOMContentLoaded

// console.log("DigitalTrustExt_Popup_Corrected_v2: Script execution finished.");