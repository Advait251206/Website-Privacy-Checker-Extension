let tabRequests={}
let tabMainFrameDomain={}
function getBaseDomainBG(hostname)
{
    if(!hostname)return null
    const parts=hostname.split('.').reverse()
    if(parts.length>=2)
    {
        if(['com','net','org','gov','edu','co','uk','ca','de','fr','app','io','tech','ai','info','biz'].includes(parts[1])&&parts.length>2)
        {
            return parts[2]+'.'+parts[1]+'.'+parts[0]
        }
        return parts[1]+'.'+parts[0]
    }
    return hostname
}
chrome.tabs.onActivated.addListener(activeInfo=>
{
  chrome.tabs.get(activeInfo.tabId,(tab)=>
  {
    if(chrome.runtime.lastError||!tab||!tab.url||tab.url.startsWith('chrome://')||tab.url.startsWith('about:'))
    {
        delete tabMainFrameDomain[activeInfo.tabId]
        return
    }
    try
    {
      const url=new URL(tab.url)
      tabMainFrameDomain[activeInfo.tabId]=url.hostname.replace(/^www\./,'')
    }
    catch(e)
    {
        delete tabMainFrameDomain[activeInfo.tabId]
    }
  })
})
chrome.webRequest.onBeforeRequest.addListener(
  (details)=>
  {
    if(details.tabId>0&&details.url)
    {
      if(!tabRequests[details.tabId])
      {
        tabRequests[details.tabId]=new Set()
      }
      try
      {
        const requestUrl=new URL(details.url)
        const requestHostname=requestUrl.hostname.replace(/^www\./,'')
        tabRequests[details.tabId].add(requestHostname)
        if(details.type==="main_frame")
        {
             tabMainFrameDomain[details.tabId]=requestHostname
             if(tabRequests[details.tabId])tabRequests[details.tabId].clear()
             tabRequests[details.tabId].add(requestHostname)
        }
      }
      catch(e){}
    }
  },
  {urls:["<all_urls>"]}
)
chrome.tabs.onRemoved.addListener((tabId)=>
{
  delete tabRequests[tabId]
  delete tabMainFrameDomain[tabId]
})
chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab)=>
{
  if(changeInfo.url&&tab&&tab.url)
  {
    if(tab.url.startsWith('chrome://')||tab.url.startsWith('about:'))
    {
        delete tabMainFrameDomain[tabId]
        if(tabRequests[tabId])tabRequests[tabId].clear()
        return
    }
    try
    {
        const newUrl=new URL(changeInfo.url)
        const newMainHostname=newUrl.hostname.replace(/^www\./,'')
        if(getBaseDomainBG(tabMainFrameDomain[tabId])!==getBaseDomainBG(newMainHostname))
        {
            tabMainFrameDomain[tabId]=newMainHostname
            if(tabRequests[tabId])
            {
                tabRequests[tabId].clear()
            }
            else
            {
                tabRequests[tabId]=new Set()
            }
            if(newMainHostname)tabRequests[tabId].add(newMainHostname)
        }
    }
    catch(e){}
  }
})
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>
{
  if(request.action==="getTabInfo_DT")
  {
    const tabId=request.tabId
    const domains=tabRequests[tabId]?Array.from(tabRequests[tabId]):[]
    const mainDomain=tabMainFrameDomain[tabId]||null
    sendResponse({
      domains:domains,
      mainFrameDomain:mainDomain
    })
    return true
  }
})
