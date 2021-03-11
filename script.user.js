// ==UserScript==
// @name          endchan-script
// @version       1.4.0
// @namespace     endchan-script
// @author        JacobSvenningsen
// @description   Adds features and fixes functionality of endchan
// @grant         unsafeWindow
// @include       http://endchan.net/*
// @include       https://endchan.net/*
// @include       http://endchan.org/*
// @include       https://endchan.org/*
// @updateURL     https://github.com/JacobSvenningsen/endchan-script/raw/master/script.user.js
// @downloadURL   https://github.com/JacobSvenningsen/endchan-script/raw/master/script.user.js
// ==/UserScript==


let oldQuotesEventMap = new Map()
let qrSettings = {}
let keyPressMap = new Map()
let onMobile = false;

function mobileStyle() {
  let style = document.createElement("style")
  style.id = "fixes_styles"
  style.type = "text/css"
  style.innerText = ' \
    body { \
        font-size: 18pt !important; \
    } \
 \
    #threadList, \
    #divThreads { \
        width:100% !important; \
    } \
\
    #quick-reply .post-table > tbody tr:first-child { \
        display:none; \
    } \
  '
  return style;
}

function insertAtCaret(open, close) {
  var startPos = qrbody.selectionStart;
  var endPos = qrbody.selectionEnd;
  var scrollTop = qrbody.scrollTop;
  var marked_text = "";
  for (let i = qrbody.selectionStart; i < qrbody.selectionEnd; i++) {
    marked_text += qrbody.value[i]
  }
  qrbody.value = qrbody.value.substring(0, startPos) + open + marked_text + close + qrbody.value.substring(endPos, qrbody.value.length);
  qrbody.focus();
  qrbody.selectionStart = startPos + open.length;
  qrbody.selectionEnd = startPos + open.length + marked_text.length;
  qrbody.scrollTop = scrollTop;
};

function KeyPress(e) { //Adds quick shortcuts for markup and posting
  var evtobj = e
  let entry = (evtobj.ctrlKey ? "C" : "") + (evtobj.altKey ? "A" : "") + (evtobj.shiftKey ? "S" : "") + evtobj.key.toUpperCase();
  let shortcut = keyPressMap.get(entry)
  if (shortcut) {
    switch (shortcut) {
      case 1: //bold
        insertAtCaret("'''","'''");
        break;
      case 2: //italics
        insertAtCaret("''","''");
        break;
      case 3: //underline
        insertAtCaret("__","__");
        break;
      case 4: //spoiler
        insertAtCaret("**","**");
        break;
      case 5: //submit
        document.getElementById("qrbutton").click();
        break;
      case 6: //strikethrough
        insertAtCaret("~~","~~");
        break;
      case 7: //header
        insertAtCaret("==","==");
        break;
      case 8: //codetag
        insertAtCaret("[code]","[/code]");
        break;
      case 9: //close quick-reply
        document.getElementById("quick-reply").getElementsByClassName("close-btn")[0].click();
        break;
      case 10: //Japanese letters
        insertAtCaret("[aa]","[/aa]");
        break;
      case 11: //White
        insertAtCaret("~","/~");
        break;
      case 12: //Pink
        insertAtCaret("!","/!");
        break;
      case 13: //Red
        insertAtCaret("@","/@");
        break;
      case 14: //Orange
        insertAtCaret("&","/&");
        break;
      case 15: //Yellow
        insertAtCaret("+","/+");
        break;
      case 16: //Green
        insertAtCaret("$","/$");
        break;
      case 17: //Cyan
        insertAtCaret("?","/?");
        break;
      case 18: //Blue
        insertAtCaret("#","/#");
        break;
      case 19: //Purple
        insertAtCaret("%","/%");
        break;
      case 20: //Brown
        insertAtCaret("^","/^");
        break;
      case 21: //Meme
        insertAtCaret("[meme]","[/meme]");
        break;
      case 22: //Autism
        insertAtCaret("[autism]","[/autism]");
        break;
        
      default: //shouldn't get here ever
        break;
    }
    e.preventDefault();     
    e.stopPropagation();
  }
}

function setNodeStyle(ele) {
  ele.style.position = "fixed"
  ele.style.top = "0px"
  ele.style.right = "0px"
  ele.style.maxWidth = (innerWidth/100*95).toString() + "px"
  ele.style.maxHeight = (innerHeight/100*95).toString() + "px"
  ele.style.width = "auto"
  ele.style.height = "auto"
  ele.style.zIndex = "110"
}

function updateVideoChild(parent, span) {
  var src = document.createElement('source');
  var video = parent.children[1]
  var link = span.previousElementSibling.firstElementChild
  if (!link) {
    link = span.previousElementSibling.previousElementSibling.href
  } else {
    link = link.href
  }
  src.setAttribute('src', link);
  src.setAttribute('type', 'video/'+link.split("video")[1].split(".")[0]); //set the correct videotype

  video.appendChild(src)
  video.removeAttribute('controls')
  video.style.display = "inline"
  video.style.maxWidth = (innerWidth/100*95).toString() + "px"
  video.style.maxHeight = (innerHeight/100*95).toString() + "px"
  video.style.width = "auto"
  video.style.height = "auto"
}

function mouseoverfunc() {
  var newnode;
  if(this.tagName == "SPAN") { //video
    if (this.children[1].style.display != "none") {
      return
    }
    newnode = this.cloneNode(true)
    setNodeStyle(newnode)
    updateVideoChild(newnode, this)
    newnode.children[1].setAttribute('muted', true) 
    newnode.children[1].muted = true //If the video isn't forced to be muted, then some browsers refuse to autoplay the video
    newnode.children[2].remove()
    
    document.body.prepend(newnode)
    newnode.children[1].play()  
  } else { //pictures
    if (this.lastElementChild.className && this.lastElementChild.style.display != "none") { // if the image is expanded, we don't want to create a hover image
      return
    }
    newnode = document.createElement("img")
    newnode.src = this.href
    setNodeStyle(newnode)
    document.body.prepend(newnode)
  }
  newnode.onclick = function() {
    this.remove()
  }
}

function mouseoutfunc(e) {
  var ele = document.body.firstElementChild
  if (ele.tagName == "SPAN" || ele.tagName == "IMG") { //Only want to remove children if they're hovered elements
    var rect = ele.getBoundingClientRect()
    if (rect.left < e.clientX && rect.height > e.clientY) {//cursor is located within video
      ele.onmouseout = mouseoutfunc
    } else {
      ele.remove()
    }
  }
}

function styleForSettingsWindow() {
  var style = document.createElement("style")
  style.id = "settings_screen_style"
  style.type = "text/css"
  style.innerText = 
    '#settingsWindow, #qrSettingsScreen { \
      display:none; \
    } \
     \
    #settingsWindow.opened h1 { \
      text-align:center; \
    } \
     \
    #settingsWindow.opened, #qrSettingsScreen.opened { \
      display:block; \
      position: fixed; \
      top: 50%; \
      left: 50%; \
      margin-right: -50%; \
      transform: translate(-50%, -50%); \
      z-index: 101; \
      max-height:60%; \
      padding:0em 1em 1em 1em; \
      overflow-y: scroll; \
      width:30em; \
    } \
     \
    #qrSettingsScreen.opened { \
      padding-top:1em; \
      z-index: 102; \
    } \
     \
    #settingsOverlay, #qrSettingsScreenOverlay { \
      display:none; \
    } \
     \
    #settingsOverlay.opened, \
    #qrSettingsScreenOverlay.opened { \
      display:block; \
      position:fixed; \
      top:0px; \
      left:0px; \
      width:100%; \
      height:100%; \
      background-color: rgba(0,0,0,0.4); \
      z-index:100; \
    } \
     \
    #qrSettingsScreenOverlay.opened { \
      background-color: rgba(0,0,0,0); \
    } \
     \
    .setting { \
      overflow:hidden; \
    } \
    .shortcut { \
      float:right; \
      margin-bottom:1em; \
      width:10em; \
    }'
  return style
}

function qrShortcutsSettingOnclick() {
  let qbody = document.getElementById("qrbody")
  if (qbody) {
    if (!qrSettings.enabled) qbody.onkeydown = KeyPress;
    else qbody.onkeydown = null;
    if (!qrSettings.enabled) qrSettingsButton.style.display = "block"; else qrSettingsButton.style.display = "none";
    qrSettings.enabled = !qrSettings.enabled;
    localStorage.setItem("qrshortcuts", JSON.stringify(qrSettings));
  }
}

function settingsElement(applyHoverImgEvent, window, updateAllLinks) {
  let oldXHR = window.XMLHttpRequest
  var standardQRreplyCallback
  
  if (window.QRreplyCallback) {
    standardQRreplyCallback = window.QRreplyCallback
    standardQRreplyCallback.progress = window.QRreplyCallback.progress
    standardQRreplyCallback.stop = window.QRreplyCallback.stop
  }
  
  var ele = document.createElement("a")
  ele.innerText = "[script settings]"
  let url = document.URL.split("#")[0]
  url += "#settings"
  
  ele.href = url
  ele.style.float = "right"
  ele.style.cursor = "pointer"
  
  var settingsBox = document.createElement("div")
  settingsBox.id = "settingsWindow"
  settingsBox.style.backgroundColor = window.getComputedStyle(document.getElementsByTagName("NAV")[0]).backgroundColor
  //settingsBox.classList.add("closed")
  
  var header = document.createElement("h1")
  header.innerText = "Settings"
  settingsBox.appendChild(header)
  settingsBox.appendChild(document.createElement("hr"))
  
  var settingsScreen = document.createElement("div")
  settingsScreen.id = "settings"
  
  function togglePostInlining() {
    if (localStorage.getItem("postInlining") == "false") {
      localStorage.setItem("postInlining", true)
      updateAllLinks(true)
    } else {
      localStorage.setItem("postInlining", false)
      updateAllLinks(false)
    }
  }
  
  function hoverImageSettingOnclick() {
    if (localStorage.getItem("hover_enabled") == "false") {
      localStorage.setItem("hover_enabled", true)
      if(document.getElementById("threadList")) {
        applyHoverImgEvent(threadList.getElementsByClassName("uploadCell"))
      }
    } else {
      if(document.getElementById("threadList")) {
        var imgs = threadList.getElementsByClassName("uploadCell")
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].lastElementChild.onmouseover = null
          imgs[i].lastElementChild.onmouseout = null
        }
      }
      localStorage.setItem("hover_enabled", false)
    }
  }
  function smallThumbsSettingOnclick() {
    if (localStorage.getItem("smallThumbs_enabled") == "true") {
      localStorage.setItem("smallThumbs_enabled", false)
      image_thumbs_settings.disabled = true
    } else {
      localStorage.setItem("smallThumbs_enabled", "true")
      image_thumbs_settings.disabled = false;
    }
  }
  
  function changeRefreshInterval() {
    if(this.value > this.max) {
      this.value = this.max
    } else if(this.value < this.min) {
      this.value = this.min
    }
    localStorage.setItem("refreshInterval", this.value)
    window.limitRefreshWait = parseInt(this.value)
  }
  
  function toggleForceReattemptRefresh() {
    if (localStorage.getItem("force_refresh") == "true") {
      window.XMLHttpRequest = oldXHR
      localStorage.setItem("force_refresh", false)
    } else {
      let refreshField = document.getElementsByClassName("divRefresh hidden")[0]
      if (refreshField) {
        refreshField = refreshField.firstElementChild.firstElementChild
        if (refreshField.checked) {
          window.XMLHttpRequest = function() {
            var realXHR = new oldXHR();
            realXHR.addEventListener("readystatechange", function() {
              if(realXHR.readyState==4 && (realXHR.status==404 || realXHR.status>=500)) {
                console.log("retrieved 404, refreshing after prefered interval anyway")
                clearInterval(refreshTimer)
                startTimer(parseInt(localStorage.getItem("refreshInterval")))
              }
            }, false);
            return realXHR;
          }
        } 
      }
      localStorage.setItem("force_refresh", true)
    }
  }
  
  function clearSpoilerFunc() {
    if (standardQRreplyCallback) {
      if (localStorage.getItem("clear_spoiler") == "true") {
        window.QRreplyCallback = standardQRreplyCallback
        localStorage.setItem("clear_spoiler", "false")
      } else {
        window.QRreplyCallback = function(status, data) {
          standardQRreplyCallback(status, data);
          let spoilerbox = document.getElementById('qrcheckboxSpoiler')
          if(spoilerbox.checked) {
            spoilerbox.click();
          }
        }
        window.QRreplyCallback.progress = standardQRreplyCallback.progress
        window.QRreplyCallback.stop = standardQRreplyCallback.stop
        localStorage.setItem("clear_spoiler", "true")
      }
    }
  }
  
  function createSettingOption(text, item, func, defaultCheck) {
    let setting = document.createElement("label")
    let input = document.createElement("input")
    let description = document.createElement("span")
    
    let checked = localStorage.getItem(item)
    if (!checked) {
      checked = typeof(defaultCheck) === "boolean" ? defaultCheck : defaultCheck.enabled
      localStorage.setItem(item, JSON.stringify(defaultCheck))
    } else if (checked == "false") {
      checked = false
      if (item === "qrshortcuts") {
        defaultCheck.enabled = false
        localStorage.setItem(item, JSON.stringify(defaultCheck))
      }
    } else if (checked == "true") {
      checked = true
      defaultCheck.enabled = true
      if (item === "qrshortcuts") localStorage.setItem(item, JSON.stringify(defaultCheck))
    } else {
      checked = JSON.parse(checked).enabled      
    }
    input.type = "checkbox"
    input.checked = checked
    input.onchange = func
    input.style.marginRight = "4px"
    input.style.marginLeft = "4px"
    description.innerText = text
    
    setting.appendChild(input)
    setting.appendChild(description)
    setting.classList.add("setting")
    return setting
  }
  
  function createQRShortcutsSettingsScreen(qrsettingItem, defaultQrSettings) {
    function createQrSettingItem(key, value) {
      let setting = document.createElement("label")
      let input = document.createElement("input")
      let description = document.createElement("span")
      let shortcut = document.createElement("input")
      
      input.type = "checkbox"
      input.checked = value.enabled
      input.onchange = function() {
        let option = qrSettings.options[key];
        let entry = (option.ctrl ? "C" : "") + (option.alt ? "A" : "") + (option.shift ? "S" : "") + option.keyCode;
        let prevEntry = keyPressMap.get(entry);
        if (prevEntry && prevEntry !== option.index) {
          qrSettings.options[key].enabled = false;
          localStorage.setItem("qrshortcuts", JSON.stringify(qrSettings))
          this.checked = false;
        } else {
          qrSettings.options[key].enabled = this.checked
          localStorage.setItem("qrshortcuts", JSON.stringify(qrSettings))
          if (option.enabled) {
            keyPressMap.set(entry, option.index);
          }
          else keyPressMap.delete(entry);
        }
      }
      input.style.marginRight = "4px"
      input.style.marginLeft = "4px"
      description.innerText = key + " shortcut"
      
      shortcut.type = "text"
      shortcut.classList.add("shortcut")
      let val = (value.ctrl ? "ctrl+" : "") + (value.alt ? "alt+" : "") + (value.shift ? "shift+" : "") + value.keyCode
      shortcut.value = val
      shortcut.onkeydown = function(e) {
        if (e.keyCode > 18 || e.keyCode < 16) { //Don't include modifier keys (ctrl, alt, shift)
          let option = qrSettings.options[key];
          let entry = (option.ctrl ? "C" : "") + (option.alt ? "A" : "") + (option.shift ? "S" : "") + option.keyCode;
          if(option.enabled) keyPressMap.delete(entry);
          qrSettings.options[key] = 
            { "enabled": option.enabled
            , "ctrl": e.ctrlKey
            , "alt": e.altKey
            , "shift": e.shiftKey
            , "keyCode": e.key.toUpperCase()
            , "index": option.index
            }
          localStorage.setItem("qrshortcuts", JSON.stringify(qrSettings));
          option = qrSettings.options[key];
          entry = (option.ctrl ? "C" : "") + (option.alt ? "A" : "") + (option.shift ? "S" : "") + option.keyCode;
          this.value = (option.ctrl ? "ctrl+" : "") + (option.alt ? "alt+" : "") + (option.shift ? "shift+" : "") + option.keyCode;
          if(option.enabled) {
            let oldkeycode = keyPressMap.get(entry)
            if (oldkeycode && oldkeycode !== option.index) { //Does another shortcut already exist?
              qrSettingsScreen.children[oldkeycode-1].firstElementChild.click();
            }
            keyPressMap.set(entry, option.index);
          }
          e.preventDefault();
          e.stopPropagation();
        }
      }
      shortcut.style.marginRight = "1em";
      
      //update keyPressMap
      if (value.enabled) {
        let entry = (value.ctrl ? "C" : "") + (value.alt ? "A" : "") + (value.shift ? "S" : "") + value.keyCode;
        keyPressMap.set(entry, value.index);
      }
      setting.appendChild(input)
      setting.appendChild(description)
      setting.appendChild(shortcut)
      setting.classList.add("setting")
      return setting
    }
    
    let b = document.createElement("button")
    b.type = "button"
    b.id = "qrSettingsButton"
    b.onclick = function() {qrSettingsScreen.classList.toggle("opened"); qrSettingsScreenOverlay.classList.toggle("opened")}
    b.innerText = "Shortcuts"
    b.style.marginRight = "12pt"
    b.style.float = "right"
    
    let qss = document.createElement("div")
    qss.id = "qrSettingsScreen"
    
    qrSettings = JSON.parse(localStorage.getItem("qrshortcuts"))
    if (qrSettings.enabled) b.style.display = "block"; else b.style.display = "none";
    
    let keys = Object.keys(qrSettings.options);
    for (let i = 0; i < keys.length; i++) {
      qss.append(createQrSettingItem(keys[i], qrSettings.options[keys[i]]))
    }
    if(keys[keys.length-1] === "closeQr") {
      let tempSettings = defaultQrSettings().options;
      let remainingKeys = Object.keys(tempSettings)
      for(let i = keys.length; i < remainingKeys.length; i++) {
        qrSettings.options[remainingKeys[i]] = tempSettings[remainingKeys[i]];
        qss.append(createQrSettingItem(remainingKeys[i], tempSettings[remainingKeys[i]]));
      }
    }
    
    qss.style.backgroundColor = settingsBox.style.backgroundColor
    qrsettingItem.append(b)
    return qss;
  }
  
  function createPreferedRefreshTimeOption(text, func) {
    let setting = createSettingOption(text, "refreshInterval", func, false)
    setting.firstElementChild.type = "number"
    setting.firstElementChild.style.width = "80px"
    setting.firstElementChild.min="10" 
    setting.firstElementChild.max="600"
    if (localStorage.getItem("refreshInterval") === "false") localStorage.setItem("refreshInterval", 20)
    setting.firstElementChild.value=localStorage.getItem("refreshInterval")
    setting.firstElementChild.onchange=null
    setting.firstElementChild.oninput=func
    return setting
  }
  
  
  function defaultQrSettings() {
    function getSetting(enabled, ctrl, shift, code, index) {return {"enabled": enabled, "ctrl": ctrl, "alt": false, "shift": shift, "keyCode": code, "index": index}}
    let settings = 
      { "enabled": false
      , "options": 
        { "bold": getSetting(true, true, false, "B", 1)
        , "italics": getSetting(true, true, false, "I", 2)
        , "underline": getSetting(true, true, true, "U", 3)
        , "spoiler": getSetting(true, true, false, "S", 4)
        , "submit": getSetting(true, true, false, "ENTER", 5)
        , "strikethrough": getSetting(true, true, "false", "D", 6)
        , "header": getSetting(true, true, false, "R", 7)
        , "codetag": getSetting(true, true, true, "F", 8)
        , "closeQr": getSetting(true, false, false, "ESCAPE", 9)
        , "japanese": getSetting(false, true, true, "A", 10)
        , "white": getSetting(false, true, false, "1", 11)
        , "pink": getSetting(false, true, false, "2", 12)
        , "red": getSetting(false, true, false, "3", 13)
        , "orange": getSetting(false, true, false, "4", 14)
        , "yellow": getSetting(false, true, false, "5", 15)
        , "green": getSetting(false, true, false, "6", 16)
        , "cyan": getSetting(false, true, false, "7", 17)
        , "blue": getSetting(false, true, false, "8", 18)
        , "purple": getSetting(false, true, false, "9", 19)
        , "brown": getSetting(false, true, false, "0", 20)
        , "meme": getSetting(false, true, false, "+", 21)
        , "autism": getSetting(false, true, false, "'", 22)
        }
      }
    
    return settings
  }
  
  settingsScreen.appendChild(createSettingOption("Post Inlining", "postInlining", togglePostInlining, true))
  settingsScreen.appendChild(createSettingOption("Quick Reply Shortcuts", "qrshortcuts", qrShortcutsSettingOnclick, defaultQrSettings()))
  settingsScreen.appendChild(createSettingOption("Image Hover", "hover_enabled", hoverImageSettingOnclick, true))
  settingsScreen.appendChild(createSettingOption("Small Thumbnails", "smallThumbs_enabled", smallThumbsSettingOnclick, false))
  settingsScreen.appendChild(createPreferedRefreshTimeOption("Prefered Autorefresh Interval", changeRefreshInterval))
  settingsScreen.appendChild(createSettingOption("Retry refreshing despite getting return code 404", "force_refresh", toggleForceReattemptRefresh, false))
  settingsScreen.appendChild(createSettingOption("Clear spoiler after post submission", "clear_spoiler", clearSpoilerFunc, false))
  toggleForceReattemptRefresh()
  toggleForceReattemptRefresh()
  clearSpoilerFunc()
  clearSpoilerFunc()

  
  settingsBox.appendChild(settingsScreen)
  settingsBox.style.zIndex = "100"
  document.body.after(settingsBox)
  settingsBox.after(createQRShortcutsSettingsScreen(settingsScreen.children[1], defaultQrSettings))
  
  let overlay = document.createElement("div")
  overlay.id = "settingsOverlay"
  overlay.onclick = function() {settingsWindow.classList.toggle("opened"); settingsOverlay.classList.toggle("opened");}
  
  settingsWindow.before(overlay)
  let qoverlay = document.createElement("div")
  qoverlay.id = "qrSettingsScreenOverlay"
  qoverlay.onclick = function() {qrSettingsScreen.classList.toggle("opened"); qrSettingsScreenOverlay.classList.toggle("opened");}
  
  settingsWindow.before(qoverlay)
  ele.onmousedown = function(e) {
    settingsBox.classList.toggle("opened")
    overlay.classList.toggle("opened")
    e.preventDefault()
    e.stopPropagation()
  }
  
  
  return ele
}

function namefield(window) {
  if (document.getElementById("fieldName") !== null) {
    fieldName.value = localStorage.getItem("namefield");
    if (window.show_quick_reply) {
      qrname.value = fieldName.value
      qrname.oninput = function() {
        localStorage.setItem("namefield", qrname.value)
      }
      qrname.autocomplete = "on"
    }
    fieldName.oninput = function() {
      localStorage.setItem("namefield", fieldName.value)
    }
  }
}

function readyFn() {
  console.log("Running script")
  
  if (GM) {
    var window = unsafeWindow
  }
    processPostingQuote = function(l) {/* discard what happens */}
  
  function mobileCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  }
  
  onMobile = mobileCheck();
  
  if (onMobile) {
    document.head.appendChild(mobileStyle());
  }
  
  let uniqueIds;
  let refreshInterval = localStorage.getItem("refreshInterval")
  if(!refreshInterval) {
    localStorage.setItem("refreshInterval", 60)
    refreshInterval = 60
  } else {
    refreshInterval = parseInt(refreshInterval)
  }
  
  if (typeof(refreshPosts) === "function") {
    
    let oldRefreshPosts = refreshPosts
    let oldRefreshInterval = 0
    function newRefreshPosts(manual) {
      let newRefreshInterval = refreshTimer
      while (oldRefreshInterval <= newRefreshInterval) {clearInterval(oldRefreshInterval++)}
      oldRefreshPosts(manual)
    }
    window.refreshPosts = newRefreshPosts
  }
  
  if(typeof refreshTimer !== "undefined") {
    window.limitRefreshWait = parseInt(localStorage.getItem("refreshInterval"))
  }
  document.body.firstElementChild.appendChild(settingsElement(applyHoverImgEvent, window, updateAllLinks))
  if (window.show_quick_reply) {
    window.show_quick_reply();
    document.getElementById("quick-reply").getElementsByClassName("close-btn")[0].onclick = function() {document.getElementById("quick-reply").style.display = "none"}
  }
  namefield(window)

  function setLoop(posts) {
    for (let i = 0; i < posts.length; i++) {
      posts[i].setAttribute("loop", "true")
    }
  }

  function applyHoverImgEvent(eles) {
    if (localStorage.getItem("hover_enabled") == "true") {
      for (let i = 0; i < eles.length; i++) {
        eles[i].lastElementChild.onmouseover = mouseoverfunc
        eles[i].lastElementChild.onmouseout = mouseoutfunc
      };
    }
  }
  
  function insertBreak(eles) {
    for (let i = 0; i < eles.length; i++) {
      eles[i].before(document.createElement("div"))
    }
  }
  
  function setIdTextColor(eles) {
    for (let i = 0; i < eles.length; i++) {
      var colorAsHex = eles[i].innerText
      var rgb = [0,0,0]
      rgb[0] = parseInt(colorAsHex[0] + colorAsHex[1], 16);
      rgb[1] = parseInt(colorAsHex[2] + colorAsHex[3], 16);
      rgb[2] = parseInt(colorAsHex[4] + colorAsHex[5], 16);

      // http://www.w3.org/TR/AERT#color-contrast
      var o = Math.round(((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000);
      var color = (o > 125) ? 'black' : 'white';
      eles[i].style.color = color 
      eles[i].style.borderRadius = "5px"
      eles[i].style.padding = "0 4px 0"
    }
  }
  
  function createPostStub(content, classes) {
    let ele = document.createElement("div")
    ele.classList.add(classes[0]); ele.classList.add(classes[1]);
    let c = document.createElement("a")
    c.innerText = content
    
    if (classes[0] === "hiddenUser") {
      c.onclick = function() {
        let id = this.innerText.slice(this.innerText.length-7, this.innerText.length-1)
        localStorage.removeItem("hidden_user_"+boardUri+id)
        let posts = document.getElementsByClassName("hiddenUser")
        for (let i = 0; i < posts.length; i++) {
          if (posts[i].classList.contains(id)) {
            posts[i].nextElementSibling.style.display = "block"
          }
        }
        let i = posts.length-1;
        while (i>=0) {posts[i].remove(); i--;}
        
      }
    } else {
      c.onclick = function() {
        let num = this.innerText.slice(12+boardUri.length, this.innerText.length-1)
        localStorage.removeItem("hidden_post_"+boardUri+num)
        this.parentElement.nextElementSibling.style.display = "block"
        this.parentElement.remove()
      }
    }
    ele.appendChild(c)
    
    return ele    
  }
  
  function addHideUserPosts(node) {
    let hideUserPosts = node.getElementsByClassName("linkQuote")
    let hidePost = node.getElementsByClassName("hidePost")
    
    if (hideUserPosts.length > 0) {
      let postNum = node.getElementsByClassName("linkQuote")[0].innerText
      hideUserPosts = hideUserPosts[0].nextElementSibling.nextElementSibling
      if (!hideUserPosts.className) {
        let id = node.getElementsByClassName("labelId")[0].innerText.slice(0,6)
        hideUserPosts.id = "hide_"+boardUri+"_"+"_User_"+id
        hideUserPosts.onclick = function() {
          let threads = document.getElementsByClassName("opCell")
          localStorage.setItem("hidden_user_"+boardUri+id, id)
     
          for (let i = 0; i < threads.length; i++) {
            var posts = threads[i].getElementsByClassName("postCell")
            for (let j = 0; j < posts.length; j++) {
              let tid = posts[j].getElementsByClassName("labelId")[0] 
              if (tid && tid.innerText.slice(0,6) === id) {
                let stub = createPostStub("[Show hidden user " + id + "]", ["hiddenUser", id])
                posts[j].before(stub)
                posts[j].style.display = "none"
              }
            }
          }
        }
      }
    
      if (hidePost[0]) {
        hidePost[0].id = "hide_"+boardUri+"_PostNumber_"+postNum
      }
      hidePost[0].onclick = function(e) {
        localStorage.setItem("hidden_post_"+boardUri+postNum, postNum)
        let stub = createPostStub("[Show hidden post " + postNum + "]", ["hiddenPost", postNum])
        node.before(stub)
        node.style.display = "none"        
        e.preventDefault();     
        e.stopPropagation(); 
      }
    }
  }
  
  function hideThisPost(node) {
    let hasId = node.getElementsByClassName("labelId")[0]
    let id = hasId ? hasId.innerText.slice(0,6) : ""
    let postNum = node.getElementsByClassName("linkQuote")[0].innerText
    let postHidden = false;
    if (localStorage.getItem("hidden_user_"+boardUri+id)) {
      let stub = createPostStub("[Show hidden user " + id + "]", ["hiddenUser", id])
      node.before(stub)
      node.style.display = "none"
      postHidden = true;
    } else if (localStorage.getItem("hidden_post_"+boardUri+node.getElementsByClassName("linkQuote")[0].innerText)) {
      let stub = createPostStub("[Show hidden post " + postNum + "]", ["hiddenPost", postNum])
      node.before(stub)
      node.style.display = "none"
      postHidden = true;
    }
    return postHidden;
  }
  
  function replaceLinkQuoting(nodes) {
    for(let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      nodes[nodeIndex].onclick = function(e) {
        var toQuote = this.innerText;

        if (typeof add_quick_reply_quote != "undefined") {
          if (!document.getElementById("qrbody") && window.show_quick_reply) {
            window.show_quick_reply()
          }
          if (document.getElementById("quick-reply").style.display == "none") document.getElementById("quick-reply").style.display = "block"
          if (document.getElementById("qrbody")) {
            let selection = window.getSelection().toString()
            // where we paste in quote and marked text. 3 indicates the quote sign ">>" and '\n'
            let pos = qrbody.selectionStart + e.target.innerText.length + selection.length + 3
            if (selection.length > 0) {
              pos += 2 // post is surely marked. Add 2 for '>' + '\n'
            }
            for (let j = 0; j < selection.length-1; j++) { //each additional newline requires position to be moved by 1 more. Newline already part of selection
              if (selection[j] === '\n') {
                pos += 1 // '>'
              }
            }
            add_quick_reply_quote(toQuote);
            qrbody.focus()
            qrbody.selectionStart = pos
            qrbody.selectionEnd = pos
            if (onMobile) {
              document.getElementById("quick-reply").style.right = (window.innerWidth - e.clientX - (document.getElementById("quick-reply").getBoundingClientRect().width / 2)).toString() + "px"
              document.getElementById("quick-reply").style.top = (e.clientY + 24).toString() + "px"
            }
          }
        }

        document.getElementById('fieldMessage').value += '>>' + toQuote + '\n';
        e.preventDefault();     
        e.stopPropagation(); 
      }
    }
  }
  
  function setOnclickEvent(clonedNode, origNode) {
    var newPics = clonedNode.getElementsByClassName("uploadCell")
    var origPics = origNode.getElementsByClassName("uploadCell")
    for(let i = 0; i < newPics.length; i++) {
      //newPics[i].lastElementChild.on("click",  this.bind(expandImage(mouseEvent, newPics[i].lastElementChild)))
      newPics[i].lastElementChild.onclick = function(e) {
        //console.log(this)
        if (this.tagName == "SPAN") {
          if (this.classList.contains("expanded")) {
            this.children[1].pause()
            this.children[1].style.display = "none"
            this.children[2].style.display = "inline"
            this.classList.remove("expanded")
          } else {
            if (!this.children[1].childElementCount) {
              updateVideoChild(this, this)
            } else {
              this.children[1].style.display = "inline"
              this.children[1].removeAttribute('controls')
            }
            this.children[1].play()
            this.classList.add("expanded")
            this.children[2].style.display = "none"
          }
        } else {
          return expandImage(e, this)
        }
      }
    }
  }
  
  function insertInlinePost(quote) {
    if (quote.tagName == "A") {
      if (document.getElementById(quote.innerText.slice(2).split(" ")[0])) {
        quote.removeAttribute("href")
        quote.style.cursor = "pointer"
        quote.style.textDecoration = "underline"
        quote.onclick = function() {
          if (quote.classList.contains("toggled")) { //Toggled determines if we should embed post, or remove embedded posts. True = remove, False = embed
            quote.classList.remove("toggled")
            quote.parentElement.parentElement.parentElement.classList.remove("postsEmbedded") // great grandparent of quote is the post in its entirety
            quote.nextElementSibling.remove()
            quote.style.opacity = "1.0"
          } else {
            var nodename = quote.innerText.slice(2).split(" ")[0]
            var nodeToClone = document.getElementById(nodename)
            if (!nodeToClone.classList.contains("postsEmbedded")) {
              var clonedNode = nodeToClone.cloneNode(true)
              clonedNode.removeAttribute("id")
              var id = clonedNode.getElementsByClassName("labelId")[0]
              if (id) {
                id.classList.remove("labelId")
              }
              clonedNode.firstElementChild.style.borderWidth = "medium"
              clonedNode.firstElementChild.style.borderStyle = "solid"
              updateLinks(clonedNode, "quoteLink", true, false)
              updateLinks(clonedNode, "panelBacklinks", true, false)
              replaceLinkQuoting(clonedNode.getElementsByClassName("linkQuote"))
              applyHoverImgEvent(clonedNode.getElementsByClassName("uploadCell"))
              setLoop(clonedNode.getElementsByTagName("video"))
              setOnclickEvent(clonedNode, nodeToClone)
              quote.parentElement.parentElement.parentElement.classList.add("postsEmbedded")
              quote.after(clonedNode)
              quote.classList.add("toggled")
              quote.style.opacity = "0.6"
            }
          }
        }
      } else {
        quote.innerText = quote.innerText.endsWith("thread)") ? quote.innerText : quote.innerText+" (cross-thread)"
      }
    }
  }
  
  function embeddedLinkHover(e) {
    var linked = document.getElementById(this.innerText.slice(2).split(" ")[0])
    let node = linked.cloneNode(true);
    node.id = "appendedNode"    
    node.style.position = "fixed"
    var id = node.getElementsByClassName("labelId")[0]
    if (id) {
      id.classList.remove("labelId")
    }
    node.style.left = e.clientX + 10 + 'px'  
    threadList.getElementsByClassName("divPosts")[0].appendChild(node)
    node.style.top = (e.clientY + appendedNode.clientHeight > window.innerHeight - 10) ? window.innerHeight - appendedNode.clientHeight - 10 + 'px' : e.clientY + 'px'
  }
  
  function updateLinks(parent, linkStr, updateEvents, updateMap) {
    var links = parent.getElementsByClassName(linkStr)
    if (linkStr == "quoteLink") {
      for (let i = 0; i < links.length; i++) {
        let d = document.getElementById(links[i].innerText.slice(2).split(" ")[0])
        if (updateMap && !oldQuotesEventMap.has(links[i])) {
          oldQuotesEventMap.set(links[i], [links[i].onmouseenter, links[i].onmouseout, links[i].href])
        }
        if (updateEvents) {
          if (d && !d.classList.contains("opCell")) {
            links[i].onmouseenter = embeddedLinkHover 
            links[i].onmouseout = function() { var node = document.getElementById("appendedNode"); if(node) {node.remove()} }
            insertInlinePost(links[i])
          } else if (!links[i].innerText.endsWith("(cross-thread)")) {
            links[i].innerText += " (cross-thread)"
          }
        }
      }
    } else {
      for (let i = 0; i < links.length; i++) {
        links[i].childNodes.forEach(function(quote) {
          if (quote.tagName == "A") {
            if (updateMap && !oldQuotesEventMap.has(quote)) {
              oldQuotesEventMap.set(quote, [quote.onmouseenter, quote.onmouseout, quote.href])
            }
            if (updateEvents && document.getElementById(quote.innerText.slice(2).split(" ")[0])) {
              quote.onmouseenter = embeddedLinkHover
              quote.onmouseout = function() { var node = document.getElementById("appendedNode"); if(node) {node.remove()} }
              insertInlinePost(quote);
            }
          }
        })
      }
    }
  }
  
  function updateAllLinks(inliningEnabled) {
    if (inliningEnabled) {
      if (document.getElementById("threadList")) {
        updateLinks(threadList, "panelBacklinks", true, false)
        updateLinks(threadList, "quoteLink", true, false)
      }
    } else {
      oldQuotesEventMap.forEach(function(value, key) {
        key.onmouseenter = value[0]
        key.onmouseout = value[1]
        key.onclick = null
        key.href = value[2]
        if (key.innerText.endsWith("(cross-thread)")) {
          key.innerText = key.innerText.slice(0, key.innerText.length-15)
        }
      })
    }
  }
  
  function updateNewlyCreatedBacklinks(node, updateLink) {
    var quotes = node.getElementsByClassName("quoteLink")
    for (let i = 0; i < quotes.length; i++) {
      var ele = document.getElementById(quotes[i].innerText.slice(2).split(" ")[0])
      if (ele) {
        var backlinks = ele.getElementsByClassName("panelBacklinks")
        for (var j = 0; j < backlinks.length; j++) {
          if (!oldQuotesEventMap.has(backlinks[j])) {
            oldQuotesEventMap.set(backlinks[j], [backlinks[j].onmouseenter, backlinks[j].onmouseout, backlinks[j].href])
          }
          if (updateLink) {
            backlinks[j].childNodes.forEach(insertInlinePost)
            backlinks[j].childNodes.forEach(function(link) {
              link.onmouseenter = embeddedLinkHover
              link.onmouseout = function() { var node = document.getElementById("appendedNode"); if(node) {node.remove()} }
            })
          }
        }
      } else {
        if (!oldQuotesEventMap.has(quotes[i])) {
          oldQuotesEventMap.set(quotes[i], [quotes[i].onmouseenter, quotes[i].onmouseout, quotes[i].href])
        }
        quotes[i].innerText = quotes[i].innerText.endsWith("thread)") ? quotes[i].innerText : quotes[i].innerText+" (cross-thread)"
      }
    }  
  }
  
  function addCounters() {
    let parent = document.createElement("span")
    let postCounter = document.createElement("div")
    let imgCounter = document.createElement("div")
    let idCounter = document.createElement("div")
    let separator = document.createElement("text")
    let ids = threadList.getElementsByClassName("labelId")
    let idStrings = []
    
    separator.innerText = " / "
    if(ids.length) {
      for(let i = 0; i < ids.length; i++) {
        idStrings.push(ids[i].innerText.slice(0,6))
      }
      uniqueIds = new Set(idStrings)
      idCounter.innerText = uniqueIds.size
      idCounter.id = "idCounter"
      idCounter.style.display = "inline"
      parent.title = "ids / posts / files"
      parent.appendChild(idCounter)
      parent.appendChild(separator.cloneNode(true))
    } else {
      parent.title = "posts / files"
    }
    
    postCounter.id = "postCounter"
    imgCounter.id = "imgCounter"
    
    parent.style.float = "right"
    parent.style.position = "absolute"
    parent.style.marginRight = "10px"
    parent.style.height = "inherit"
    parent.style.display = "inline"
    parent.style.right = "0px"
    parent.style.zIndex = "-1"
    
    postCounter.innerText = threadList.getElementsByClassName("postCell").length
    imgCounter.innerText = threadList.getElementsByClassName("uploadCell").length
    
    postCounter.style.display = "inline"
    imgCounter.style.display = "inline"
    
    parent.appendChild(postCounter)
    parent.appendChild(separator)
    parent.appendChild(imgCounter)
    
    if(document.getElementsByClassName("divRefresh")[0]) {
      document.getElementsByClassName("divRefresh")[0].firstElementChild.after(parent)
    }
  }
  
  function updateCounters(node) {
    postCounter.innerText = parseInt(postCounter.innerText) + 1
    imgCounter.innerText = parseInt(imgCounter.innerText) + node.getElementsByClassName("uploadCell").length
    if(uniqueIds) {
      let id = node.getElementsByClassName("labelId")[0]
      if (id) {
        idCounter.innerText = uniqueIds.add(id.innerText.slice(0,6)).size
      }
    }
  }
  
  function updateTime(node) {
    window.updateTimeNode(node.getElementsByClassName("labelCreated")[0], useLocaltime.checked)
  }
  
  function moveMultipleUploadFromPost(post, isOP) {
    if (post.classList.contains("multipleUploads")) {
      post.classList.remove("multipleUploads")
      let addTo = isOP ? post.getElementsByClassName("innerOP")[0] : post.getElementsByClassName("innerPost")[0]
      addTo.classList.add("multipleUploads")
    }
  }
  
  function shortenFilenames(node) {
    let filenames = node.getElementsByClassName("originalNameLink");
    
    for (let i = 0; i < filenames.length; ++i) {
      if (filenames[i].innerText.length > 38) {
        filenames[i].title = filenames[i].innerText;
        filenames[i].innerText = filenames[i].innerText.slice(0,35) + "...";
      }
    }
  }
  
  const updateNewPosts = function(list, observer) {
    for(let mutation of list) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
            if (node.id !== "appendedNode") {
            setLoop(node.getElementsByTagName("video"))
            applyHoverImgEvent(node.getElementsByClassName("uploadCell"))
            insertBreak(node.getElementsByClassName("divMessage"))
            setIdTextColor(node.getElementsByClassName("labelId"))
            replaceLinkQuoting(node.getElementsByClassName("linkQuote"))
            updateLinks(node, "quoteLink", localStorage.getItem("postInlining") == "true", true)
            updateNewlyCreatedBacklinks(node, localStorage.getItem("postInlining") == "true")
            updateCounters(node)
            updateTime(node)
            addHideUserPosts(node)
            shortenFilenames(node)
            //moveMultipleUploadFromPost(node, false)
            hideThisPost(node)
          }
        })
      }
    }
  }


  
  function moveMultipleUploadsClassInit(threads) {
    opCells = threads.childNodes
    for (let i = 0; i < opCells.length; ++i) {
      if (opCells[i].tagName === "DIV") {
        moveMultipleUploadFromPost(opCells[i], true)
        /*let posts = opCells[i].getElementsByClassName("postCell")
        for (let j = 0; j < posts.length; ++j) {
          moveMultipleUploadFromPost(posts[j], false)
        }*/
      }
    }
  }
  
  if (document.getElementById("threadList")) {
    setLoop(threadList.getElementsByTagName("video"))
    applyHoverImgEvent(threadList.getElementsByClassName("uploadCell"))
    setIdTextColor(threadList.getElementsByClassName("labelId"))
    replaceLinkQuoting(document.getElementsByClassName("linkQuote"))
    updateLinks(threadList, "panelBacklinks", localStorage.getItem("postInlining") == "true", true)
    updateLinks(threadList, "quoteLink", localStorage.getItem("postInlining") == "true", true)
    moveMultipleUploadsClassInit(document.getElementById("divThreads"))
    observer = new MutationObserver(updateNewPosts)
    observer.observe(threadList.getElementsByClassName("divPosts")[0], {childList:true}) // element to observe for changes, and conf
    if(typeof refreshTimer !== "undefined" && currentRefresh > parseInt(localStorage.getItem("refreshInterval"))) {
      currentRefresh = parseInt(localStorage.getItem("refreshInterval"))
    }
    if (document.getElementById('postreply')) {
      jsButton.onclick = function() {
        postReply(); 
        if(document.getElementById("qrbody")) {qrbody.value = ""}
      }
    }

    //Credit goes to https://stackoverflow.com/a/15369753
    if (document.getElementById('qrbody')) {
      qrbody.onpaste = function (event) {
        // use event.originalEvent.clipboard for newer chrome versions
        var items = (event.clipboardData  || event.originalEvent.clipboardData).items;
        // find pasted image among pasted items
        var blob = null;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") === 0) {
            blob = items[i].getAsFile();
          }
        }
        // load image if there is a pasted image
        if (blob !== null) {
          addSelectedFile(blob);
        }
      }
      qrbutton.onclick = function (event) {
        if (selectedFiles[0] || qrbody.textLength) {
          qrbutton.disabled = true
        }
        QRpostReply()
      }
      let oldDragFunc = document.getElementById("quick-reply").getElementsByClassName("handle")[0].onmousedown
      document.getElementById("quick-reply").getElementsByClassName("handle")[0].onmousedown = function(e) {oldDragFunc(e); e.preventDefault(); e.stopPropagation();}
      if (qrSettings.enabled) qrbody.onkeydown = KeyPress
      
      if (onMobile) {
        let qr = document.getElementById("quick-reply");
        let secondRow = qr.getElementsByClassName("post-table")[0].childNodes[0].childNodes[2];
        secondRow.appendChild(qremail.parentElement);
        secondRow.appendChild(qrsubject.parentElement);
        qr.getElementsByClassName("post-table")[0].childNodes[0].childNodes[4].remove();
        qr.getElementsByClassName("post-table")[0].childNodes[0].childNodes[3].remove();
        qremail.parentElement.colSpan = qrname.parentElement.colSpan = qrsubject.parentElement.colSpan = 1;
        qr.getElementsByClassName("post-table")[0].childNodes[0].childNodes[3].firstChild.colSpan = 3;
        qr.getElementsByClassName("post-table")[0].childNodes[0].childNodes.forEach(p => { 
          if(p.nodeName === "TR" && p !== qrname.parentElement.parentElement && p.firstChild.nodeName === "TD") {
            p.firstChild.colSpan = 3;
          }
        });
      }
    }
    addCounters()
    if (document.getElementById("divPosts")) {
      divPosts.childNodes.forEach(addHideUserPosts)
      divPosts.childNodes.forEach(hideThisPost)
    } else {
      var eles = document.getElementsByClassName("divPosts")
      for (let i = 0; i < eles.length; i++) {
        let children = eles[i].childNodes
        let index = children.length-1;
        while (index >= 0) {
          addHideUserPosts(children[index])
          hideThisPost(children[index])
          index--;
        }
      }
    }
  }
  console.log("done")
}
window.onload = readyFn

function imageThumbsStyle() {
  let style = document.createElement("style")
  style.id = "image_thumbs_settings"
  style.type = "text/css"
  style.innerText = (localStorage.getItem("smallThumbs_enabled") == "true") ? ' \
    a.imgLink img:not([class="imgExpanded"]), \
    .uploadCell span img:not([class="imgExpanded"]){ \
      height: auto; \
      width: auto; \
      max-width: 125px; \
      max-height: 125px; \
    } \
  ' : 'a.imgLink img:not([class="imgExpanded"]) {}'
  return style
}

function extraStyles() {
  let style = document.createElement("style")
  style.id = "fixes_styles"
  style.type = "text/css"
  style.innerText = ' \
    .selectedCell { \
        word-break: break-all; \
    } \
    \
    #post-form-inner, #post-form-inner > form, table.post-table { \
        background: inherit; \
    } \
    span.spoiler { \
        background-color: #000; \
    } \
    span.spoiler a:not(:hover) { \
        color: #000; \
    } \
  '
  return style;
}

(function() { //fixes post counter and in turn, also post hiding
  console.log("setup")
  var orig = document.getElementsByClassName.bind(document);
  document.getElementsByClassName = (function(str) {
      if (str == "labelId") {
          return threadList.getElementsByClassName('labelId');
      } else {
          return orig(str);
      }
  });
  document.head.appendChild(styleForSettingsWindow())
  document.head.appendChild(imageThumbsStyle())
  document.head.appendChild(extraStyles())
  console.log("done injecting css")
}).call();



