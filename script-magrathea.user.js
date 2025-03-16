// ==UserScript==
// @name          endchan-magrathea-script
// @version       0.4.6
// @namespace     endchan-magrathea-script
// @author        JacobSvenningsen
// @description   Adds features and fixes functionality of endchan
// @grant         unsafeWindow
// @grant         GM.getValue
// @grant         GM.setValue
// @grant         GM.listValues
// @include       http://magrathea.endchan.net/*
// @include       https://magrathea.endchan.net/*
// @include       http://magrathea.endchan.org/*
// @include       https://magrathea.endchan.org/*
// @include       http://magrathea.endchan.gg/*
// @include       https://magrathea.endchan.gg/*
// @updateURL     https://github.com/JacobSvenningsen/endchan-script/raw/master/script-magrathea.user.js
// @downloadURL   https://github.com/JacobSvenningsen/endchan-script/raw/master/script-magrathea.user.js
// ==/UserScript==

let qrSettings = {};
let keyPressMap = new Map();
let idsCounterMap = new Map();
let postsByIdsMap = new Map();

let PosterNamesWhitelist;

function GetSingleThreadOrNull() {
  let threads = document.getElementsByClassName("thread noflex threadsContainer");
  if (threads.length === 1) {
    return threads[0];
  } else {
    return null;
  }
}

async function initializePosterNamesWhitelist() {
  if (GetSingleThreadOrNull()) {
    PosterNamesWhitelist = new Set(await GM.getValue("WhiteListPosters", []));
  }
}

async function mergePosts() {
  let sharedPosts = JSON.parse(await GM.getValue("MyPosts_SharedPosts", "[]"));
  let domainPosts = JSON.parse(localStorage.getItem("yous"));
  if(domainPosts === null) {
    domainPosts = [];
  }
  let length = sharedPosts.length;
  let found = false;

  for (let i = 0; i < domainPosts.length; i++) {
    found = false;
    for (let j = 0; j < length; j++) {
      if (domainPosts[i] === sharedPosts[j]) {
        //Item already exists in sharedPosts, skipping
        found = true;
        break;
      }
    }
    if (!found) {
    //Didn't find the item in sharedPosts, adding it
      sharedPosts.push(domainPosts[i]);
      length += 1;
    }
  }
  domainPosts = sharedPosts;
  localStorage.setItem("yous", JSON.stringify(domainPosts));
  await GM.setValue("MyPosts_SharedPosts", JSON.stringify(sharedPosts));
}

async function settingsElement(window) {
  var ele = document.createElement("a");
  ele.innerText = "[script settings]";
  let url = document.URL.split("#")[0];
  url += "#settings";

  ele.href = url;
  ele.style.float = "right";
  ele.style.cursor = "pointer";

  var settingsBox = document.createElement("div");
  settingsBox.id = "settingsWindow";
  settingsBox.style.backgroundColor = window.getComputedStyle(document.getElementsByTagName("NAV")[0]).backgroundColor;

  var header = document.createElement("h1");
  header.innerText = "Settings";
  settingsBox.appendChild(header);
  settingsBox.appendChild(document.createElement("hr"));

  var settingsScreen = document.createElement("div");
  settingsScreen.id = "settings";

  async function myPostsSharing() {
    let postsShared = !JSON.parse(await GM.getValue("MyPosts_Shared", "false"));
    if (postsShared) {
      await mergePosts();
    }
    await GM.setValue("MyPosts_Shared", postsShared.toString());
  }

  async function hideAnonPosts() {
    let anonHidden = !JSON.parse(await GM.getValue("HideAnon", "false"));
    await GM.setValue("HideAnon", anonHidden.toString());
  }

  async function createSettingOption(text, item, func, defaultCheck) {
    let setting = document.createElement("label");
    let input = document.createElement("input");
    let description = document.createElement("span");

    let checked = await GM.getValue(item, null);
    if (!checked) {
      checked = typeof(defaultCheck) === "boolean" ? defaultCheck : defaultCheck.enabled;
      await GM.setValue(item, JSON.stringify(defaultCheck));
    } else if (checked == "false") {
      checked = false;
      if (item === "qrshortcuts") {
        defaultCheck.enabled = false;
        await GM.setValue(item, JSON.stringify(defaultCheck));
      }
    } else if (checked == "true") {
      checked = true;
      defaultCheck.enabled = true;
      if (item === "qrshortcuts") {
        await GM.setValue(item, JSON.stringify(defaultCheck));
      }
    } else if (typeof(checked) !== "object") {
      checked = JSON.parse(checked)?.enabled;
    }
    input.type = "checkbox";
    input.checked = checked;
    input.onchange = func;
    input.style.marginRight = "4px";
    input.style.marginLeft = "4px";
    description.innerText = text;

    setting.appendChild(input);
    setting.appendChild(description);
    setting.classList.add("setting");
    return setting;
  }

  async function createQRShortcutsSettingsScreen(qrsettingItem, defaultQrSettings) {
    function createQrSettingItem(key, value) {
      let setting = document.createElement("label");
      let input = document.createElement("input");
      let description = document.createElement("span");
      let shortcut = document.createElement("input");

      input.type = "checkbox"
      input.checked = value.enabled
      input.onchange = async function() {
        let option = qrSettings.options[key];
        qrSettings.options[key].enabled = this.checked;
        await GM.setValue("qrshortcuts", JSON.stringify(qrSettings));
      }
      input.style.marginRight = "4px";
      input.style.marginLeft = "4px";
      description.innerText = key + " shortcut";

      shortcut.type = "text";
      shortcut.classList.add("shortcut");
      let val = (value.ctrl ? "ctrl+" : "") + (value.alt ? "alt+" : "") + (value.shift ? "shift+" : "") + value.keyCode
      shortcut.value = val;
      shortcut.onkeydown = function(e) {
        if (e.keyCode > 18 || e.keyCode < 16) { //Don't include modifier keys (ctrl, alt, shift)
          let option = qrSettings.options[key];
          qrSettings.options[key] =
            { "enabled": option.enabled
            , "ctrl": e.ctrlKey
            , "alt": e.altKey
            , "shift": e.shiftKey
            , "keyCode": e.key.toUpperCase()
            , "index": option.index
            };
          GM.setValue("qrshortcuts", JSON.stringify(qrSettings));
          option = qrSettings.options[key];
          this.value = (option.ctrl ? "ctrl+" : "") + (option.alt ? "alt+" : "") + (option.shift ? "shift+" : "") + option.keyCode;
          if(option.enabled) {
            let nameOfAnotherOptionWithSameMap = Object.keys(qrSettings.options).find(o => qrSettings.options[o].ctrl === option.ctrl &&
              qrSettings.options[o].alt === option.alt &&
              qrSettings.options[o].shift === option.shift &&
              qrSettings.options[o].keyCode === option.keyCode &&
              qrSettings.options[o].index !== option.index);
            if (nameOfAnotherOptionWithSameMap) {
                qrSettingsScreen.children[qrSettings.options[nameOfAnotherOptionWithSameMap].index - 1].firstElementChild.click();
            }
          }
          e.preventDefault();
          e.stopPropagation();
        }
      }
      shortcut.style.marginRight = "1em";

      setting.appendChild(input)
      setting.appendChild(description)
      setting.appendChild(shortcut)
      setting.classList.add("setting")
      return setting
    }

    let b = document.createElement("button");
    b.type = "button";
    b.id = "qrSettingsButton";
    b.onclick = function() {
      qrSettingsScreen.classList.toggle("opened");
      qrSettingsScreenOverlay.classList.toggle("opened");
    }
    b.innerText = "Shortcuts";
    b.style.marginRight = "12pt";
    b.style.float = "right";

    let qss = document.createElement("div");
    qss.id = "qrSettingsScreen";

    qrSettings = JSON.parse(await GM.getValue("qrshortcuts", '{"enabled":false}'));
    if (qrSettings.enabled) b.style.display = "block"; else b.style.display = "none";

    let keys = Object.keys(qrSettings.options);
    for (let i = 0; i < keys.length; i++) {
      qss.append(createQrSettingItem(keys[i], qrSettings.options[keys[i]]));
    }
    if(keys[keys.length-1] === "closeQr") {
      let tempSettings = defaultQrSettings().options;
      let remainingKeys = Object.keys(tempSettings)
      for(let i = keys.length; i < remainingKeys.length; i++) {
        qrSettings.options[remainingKeys[i]] = tempSettings[remainingKeys[i]];
        qss.append(createQrSettingItem(remainingKeys[i], tempSettings[remainingKeys[i]]));
      }
    }

    qss.style.backgroundColor = settingsBox.style.backgroundColor;
    qrsettingItem.append(b);
    return qss;
  }

  async function createPreferedRefreshTimeOption(text) {
    let func = async function() {
      if(this.value > this.max) {
        this.value = this.max;
      } else if(this.value < this.min) {
        this.value = this.min;
      }
      await GM.setValue("Settings.RefreshInterval", this.value);
    };
    let defaultValue = await GM.getValue("Settings.RefreshInterval", "600");
    let setting = await createSettingOption(text, "refreshInterval", func, false);
    setting.firstElementChild.type = "number";
    setting.firstElementChild.style.width = "80px";
    setting.firstElementChild.min="10";
    setting.firstElementChild.max="600";
    setting.firstElementChild.value=defaultValue;
    setting.firstElementChild.onchange = null;
    setting.firstElementChild.oninput = func;
    return setting
  }


  async function createWhitelistOption() {
    let func = async function() {
      let val = this.value;
      if (val === "") {
        val = [];
      } else {
        val = val.split("¤");
      }
      await GM.setValue("WhiteListPosters", val);
    }
    let defaultValue = [];
    let setting = await createSettingOption("¤", "WhiteListPosters", func, defaultValue);
    let currentValue = await GM.getValue("WhiteListPosters", defaultValue);
    if (typeof(currentValue) == "string") {
      await GM.setValue("WhiteListPosters", defaultValue);
      currentValue = defaultValue;
    }
    setting.firstElementChild.type = "text";
    setting.firstElementChild.placeholder = "Poster name whitelist option. Separate with '¤'";
    setting.firstElementChild.style.width = "400px";
    setting.firstElementChild.value=currentValue.join("¤");
    setting.firstElementChild.oninput = func;
    return setting;
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
      };

    return settings;
  }
  async function qrShortcutsSettingOnclick() {
      if (!qrSettings.enabled) {
        qrSettingsButton.style.display = "block";
      } else {
        qrSettingsButton.style.display = "none";
      }
      qrSettings.enabled = !qrSettings.enabled;
      await GM.setValue("qrshortcuts", JSON.stringify(qrSettings));
  }

  //settingsScreen.appendChild(await createSettingOption("Post Inlining", "postInlining", togglePostInlining, true))
  settingsScreen.appendChild(await createSettingOption("Quick Reply Shortcuts", "qrshortcuts", qrShortcutsSettingOnclick, defaultQrSettings()));
  //settingsScreen.appendChild(createSettingOption("Image Hover", "hover_enabled", hoverImageSettingOnclick, true))
  //settingsScreen.appendChild(createSettingOption("Small Thumbnails", "smallThumbs_enabled", smallThumbsSettingOnclick, false))
  settingsScreen.appendChild(await createPreferedRefreshTimeOption("Prefered Autorefresh Interval"));
  //settingsScreen.appendChild(createSettingOption("Retry refreshing despite getting return code 404", "force_refresh", toggleForceReattemptRefresh, false))
  //settingsScreen.appendChild(createSettingOption("Clear spoiler after post submission", "clear_spoiler", clearSpoilerFunc, false))
  settingsScreen.appendChild(await createSettingOption("Share MyPosts between domains", "MyPosts_Shared", myPostsSharing, false));
  settingsScreen.appendChild(await createSettingOption("Hide certain posters by default", "HideAnon", hideAnonPosts, false));
  settingsScreen.appendChild(await createWhitelistOption());
  //settingsScreen.appendChild(createSettingOption("Preview image in Quick Reply", "imagePreview", toggleImagePreview, true))
  //toggleForceReattemptRefresh()
  //toggleForceReattemptRefresh()
  //clearSpoilerFunc()
  //clearSpoilerFunc()


  settingsBox.appendChild(settingsScreen);
  settingsBox.style.zIndex = "100";
  document.body.after(settingsBox);
  settingsBox.after(await createQRShortcutsSettingsScreen(settingsScreen.children[0], defaultQrSettings));

  let overlay = document.createElement("div");
  overlay.id = "settingsOverlay";
  overlay.onclick = function() {
    settingsWindow.classList.toggle("opened");
    settingsOverlay.classList.toggle("opened");
  }

  settingsWindow.before(overlay);
  let qoverlay = document.createElement("div");
  qoverlay.id = "qrSettingsScreenOverlay";
  qoverlay.onclick = function() {qrSettingsScreen.classList.toggle("opened"); qrSettingsScreenOverlay.classList.toggle("opened");}

  settingsWindow.before(qoverlay);
  ele.onmousedown = function(e) {
    settingsBox.classList.toggle("opened");
    overlay.classList.toggle("opened");
    e.preventDefault();
    e.stopPropagation();
  }


  return ele;
}

async function SetupSettingsMenuItem()
{
  if (document.URL.includes("/user/settings")) {
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
        #settingsWindow .setting, \
        #qrSettingsScreen .setting { \
          overflow:hidden; \
          margin: 0 4 0 4; \
        } \
        #settingsWindow label, \
        #qrSettingsScreen label { \
          display:block; \
        } \
        #qrSettingsScreen .shortcut { \
          float:right; \
          margin-bottom:1em; \
          width:10em; \
        }'
      return style;
    }

    if (GM) {
      var window = unsafeWindow;
    }

    let usersettingsTable = document.getElementsByClassName("pages")[0].firstElementChild;
    let settingsTableEntry = document.createElement("li");
    let settingsUrl = document.URL + "#settings";
    settingsTableEntry.appendChild(await settingsElement(window));
    usersettingsTable.appendChild(settingsTableEntry);
    document.head.appendChild(styleForSettingsWindow());
  }
}

function DecorateQuickReplyWithIds()
{
  let qr = document.getElementById("postform");
  if (qr) {
    qr.name.id = "GM_qrname";
    qr.message.id = "GM_qrbody";
    qr.lastElementChild.id = "GM_qrSubmitButton";
    qr.getElementsByClassName("close")[0].id = "GM_closeButton";
    if (qr.flag) {
      qr.flag.id =  "GM_qrFlagSelector";
    }
  }
}

async function SetKeypressOnQr()
{
  function KeyPress(e) { //Adds quick shortcuts for markup and posting
    var evtobj = window.event? event : e;
    let entry = (evtobj.ctrlKey ? "C" : "") + (evtobj.altKey ? "A" : "") + (evtobj.shiftKey ? "S" : "") + "_" + evtobj.key.toUpperCase();
    let shortcut = keyPressMap.get(entry);
    if (shortcut) {
      function insertAtCaret(open, close) {
        let qrbody = document.getElementById("GM_qrbody");
        let startPos = qrbody.selectionStart;
        let endPos = qrbody.selectionEnd;
        let scrollTop = qrbody.scrollTop;
        let marked_text = "";
        for (let i = qrbody.selectionStart; i < qrbody.selectionEnd; i++) {
          marked_text += qrbody.value[i];
        }
        qrbody.value = qrbody.value.substring(0, startPos) + open + marked_text + close + qrbody.value.substring(endPos, qrbody.value.length);
        qrbody.focus();
        qrbody.selectionStart = startPos + open.length;
        qrbody.selectionEnd = startPos + open.length + marked_text.length;
        qrbody.scrollTop = scrollTop;
      };
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
          document.getElementById("GM_qrSubmitButton").click();
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
          document.getElementById("GM_closeButton").click();
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

  let qr = document.getElementById("postform");
  if (qr) {
    let qrSettings = JSON.parse(await GM.getValue("qrshortcuts", '{"enabled":false}'));
    if (qrSettings.enabled) {
      Object.keys(qrSettings.options).forEach(settingName => {
        let option = qrSettings.options[settingName];
        if (option.enabled) {
          let entry = (option.ctrl ? "C" : "") + (option.alt ? "A" : "") + (option.shift ? "S" : "") + "_" + option.keyCode;
          keyPressMap.set(entry, option.index);
        }
      })
      GM_qrbody.onkeydown = KeyPress;
    }
  }
}


async function namefield() {
  let postform = document.getElementById("bottom_postform");

  if (postform) {
    let namefield = postform.name;
    let name = await GM.getValue("Settings.Name", "");
    let qr = document.getElementById("postform");
    namefield.value = name;
    localStorage.name = name;
    if (qr) {
      qr.style.display = "flex";
      let qrNameField = qr.name;
      qrNameField.value = name;
      qrNameField.oninput = async function() {
        await GM.setValue("Settings.Name", qrNameField.value);
        localStorage.name = qrNameField.value;
      }
      qrNameField.autocomplete = "on";
    }
    namefield.oninput = async function() {
      await GM.setValue("Settings.Name", namefield.value);
      localStorage.name = namefield.value;
    }
  }
}

async function flagField(boardname) {
  let postform = document.getElementById("bottom_postform");

  if (boardname && postform && postform.flag) {
    let key = "Settings.Flags." + boardname;
    let boardFlagEntry = Number(await GM.getValue(key, "0"));
    boardFlagEntry = boardFlagEntry >= postform.flag.length ? 0 : boardFlagEntry;
    let qr = document.getElementById("postform");
    postform.flag.selectedIndex = boardFlagEntry;
    if (qr) {
      qr.flag.selectedIndex = boardFlagEntry;
      qr.flag.oninput = async function() {
        await GM.setValue(key, qr.flag.selectedIndex.toString());
      }

      qr.oldreset = qr.reset;
      qr.reset = async function() {
        this.oldreset();
        this.flag.selectedIndex = await GM.getValue(key, "0");
      }
    }
    postform.flag.oninput = async function() {
      await GM.setValue(key, postform.flag.selectedIndex.toString());
    }
    postform.oldreset = postform.reset;
    postform.reset = async function() {
      this.oldreset();
      this.flag.selectedIndex = await GM.getValue(key, "0");
    }
  }
}


// gibberish detector js
(function (h) {
    function e(c, b, a) { return c < b ? (a = b - c, Math.log(b) / Math.log(a) * 100) : c > a ? (b = c - a, Math.log(100 - a) / Math.log(b) * 100) : 0 } function k(c) { for (var b = {}, a = "", d = 0; d < c.length; ++d)c[d] in b || (b[c[d]] = 1, a += c[d]); return a } h.detect = function (c) {
        if (0 === c.length || !c.trim()) return 0; for (var b = c, a = []; a.length < b.length / 35;)a.push(b.substring(0, 35)), b = b.substring(36); 1 <= a.length && 10 > a[a.length - 1].length && (a[a.length - 2] += a[a.length - 1], a.pop()); for (var b = [], d = 0; d < a.length; d++)b.push(k(a[d]).length); a = 100 * b; for (d = b =
            0; d < a.length; d++)b += parseFloat(a[d], 10); a = b / a.length; for (var f = d = b = 0; f < c.length; f++) { var g = c.charAt(f); g.match(/^[a-zA-Z]+$/) && (g.match(/^(a|e|i|o|u)$/i) && b++, d++) } b = 0 !== d ? b / d * 100 : 0; c = c.split(/[\W_]/).length / c.length * 100; a = Math.max(1, e(a, 45, 50)); b = Math.max(1, e(b, 35, 45)); c = Math.max(1, e(c, 15, 20)); return Math.max(1, (Math.log10(a) + Math.log10(b) + Math.log10(c)) / 6 * 100)
    }
})("undefined" === typeof exports ? this.gibberish = {} : exports)

// shannon entropy
function entropy(str) {
    return Object.values(Array.from(str).reduce((freq, c) => (freq[c] = (freq[c] || 0) + 1) && freq, {})).reduce((sum, f) => sum - f / str.length * Math.log2(f / str.length), 0)
}

// vowel counter
function countVowels(word) {
    let m = word.match(/[aeiou]/gi);
    return m === null ? 0 : m.length;
}

// dummy function
function isTrue(value){
    return value
}

// validate string by multiple tests
function isGibberish(str, entropyrating, gibberishRating){
    let strWithoutPunct = str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

    let entropyValue = entropy(str) < entropyrating;
    let gibberishValue = gibberish.detect(str) < gibberishRating;
    let vovelValue = 30 < 100 / strWithoutPunct.length * countVowels(strWithoutPunct) && 100 / strWithoutPunct.length * countVowels(str) < 35;
    let notGibberish = [entropyValue, gibberishValue, vovelValue].filter(isTrue).length > 1
    return !notGibberish;
}

async function hideAnonIfEnabled(node) {
  if (JSON.parse(await GM.getValue("HideAnon", "false"))) {
    if (node) {
      let posts = node.getElementsByClassName("post-container");
      for (let i = 0; i < posts.length; i++) {
        let posterName = posts[i].attributes.getNamedItem("data-name");
        if (posterName && PosterNamesWhitelist.has(posterName.value)) {
          continue;
        }
        let files = posts[i].querySelectorAll(".filename");
        let nameIsGibberish = posterName && posterName.value.length > 5 && isGibberish(posterName.value, 3.0, 40);
        let filesThatAreGibberish = files.values().filter(e => { let splitTitle = e.title.split("."); let titleLength = e.title.length - 1 - splitTitle[splitTitle.length-1].length; return isGibberish(e.title.slice(9, titleLength), 3.0, 30); });
        let idIsOne = posts[0].querySelector(".user-id")?.attributes["data-count"].value == " (1)";
        let conditionsMet = 0;
        if (idIsOne) conditionsMet++;
        if (nameIsGibberish) conditionsMet++;
        if (filesThatAreGibberish.next().value) conditionsMet++;
        if (conditionsMet > 1) {
          let parent = posts[i].parentElement;
          let hiddenElement = document.createElement("div");
          let text = "[Show hidden post " + posts[i].id + " (" + posterName.value + ")]";
          let innerElement = document.createElement("a");
          innerElement.innerText = text;
          innerElement.onclick = function() {
            this.parentElement.nextElementSibling.style.display = "inline-block";
            this.parentElement.before(document.createElement("br"));
            this.parentElement.remove();
          }
          hiddenElement.appendChild(innerElement);
          hiddenElement.classList.add("hiddenPost");
          parent.previousSibling.remove();
          parent.before(hiddenElement);
          parent.style.display = "none";
        }
      }
    }
  }
}

function setIdTextColor(eles) {
  for (let i = 0; i < eles.length; i++) {
    let colorAsHex = eles[i].innerText;
    let rgb = [0,0,0];
    rgb[0] = parseInt(colorAsHex[0] + colorAsHex[1], 16);
    rgb[1] = parseInt(colorAsHex[2] + colorAsHex[3], 16);
    rgb[2] = parseInt(colorAsHex[4] + colorAsHex[5], 16);

    // http://www.w3.org/TR/AERT#color-contrast
    let o = Math.round(((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000);
    let color = (o > 125) ? 'black' : 'white';
    eles[i].style.color = color;
    eles[i].style.borderRadius = "5px";
    eles[i].style.padding = "0 4px 0";
    eles[i].style.textShadow = "unset";
  }
}

function assignIdUpdaterFunction(userIds) {
  userIds.forEach(uid => {
    uid.updateIdCounter = function(newval) {
      this.setAttribute("data-count", " (" + newval + ")");
      this.setAttribute("mobiletitle", "Double tap highlight (" + newval + ")");
      this.setAttribute("title", "Double click to highlight (" + newval + ")");
    }
  });
}

function updateNumberOfPostsByIds(userIds, callback) {
  userIds.forEach(uid => {
    if (postsByIdsMap.has(uid.innerText)) {
      postsByIdsMap.get(uid.innerText).push(uid);
    } else {
      postsByIdsMap.set(uid.innerText, [uid]);
    }

    if (idsCounterMap.has(uid.innerText)) {
      idsCounterMap.set(uid.innerText, idsCounterMap.get(uid.innerText) + 1);
      callback(uid.innerText);
    } else {
      idsCounterMap.set(uid.innerText, 1);
    }
  });
}

const updateIdCountersForUserIds = function(uids) {
  uids.values().flatMap(e => postsByIdsMap.get(e)).forEach(uid => { uid.updateIdCounter(idsCounterMap.get(uid.innerText)); });
}

function transformLinksInPosts(node) {
  function constructNewHtml(html) {
    if (html.length <= 0) {
      return html;
    }
    let startIndex = html.indexOf("https://");
    if (startIndex < 0) {
      return html;
    }
    let startIndexYoutubeTag = html.indexOf('<span class="youtube_wrapper">');
    if (startIndexYoutubeTag > -1 && startIndexYoutubeTag < startIndex) {
      let endTagText = "</a></span>";
      let endTag = html.indexOf(endTagText) + endTagText.length;
      return html.substring(0, endTag) + constructNewHtml(html.substring(endTag));
    }
    let newHtml = html.substring(0, startIndex);
    let rest = html.substring(startIndex + 1);
    let endIndexSpace = rest.indexOf(" ");
    let endIndexNewline = rest.indexOf("\n");
    let endIndexNewLink = rest.indexOf("https://");
    let endIndexRest = rest.length;
    let endIndex = [endIndexSpace, endIndexNewline, endIndexNewLink, endIndexRest].filter(e => e > 0).toSorted((a,b) => a > b)[0];
    endIndex = endIndex + startIndex + 1;
    let linkText = html.substring(startIndex, endIndex);
    let link = '<a href="' + linkText + '">' + linkText + '</a>';
    newHtml = newHtml + link;
    return newHtml + constructNewHtml(html.substring(endIndex), html);
  }
  node.querySelectorAll(".post-message").forEach(e => {
    e.innerHTML = constructNewHtml(e.innerHTML);
  });
}

function SetupObserver()
{
  function updateQuotes(node, thread) {
    let eles = node.getElementsByClassName("quote");
    let nodePostId = node.id;
    let board = node.attributes.getNamedItem("data-board").value;
    if (thread) {
      let threadNumber = thread.previousElementSibling.previousElementSibling.value
      let constructedUrlPart = "/" + board + "/thread/" + threadNumber + ".html#";
      let constructedUrl = constructedUrlPart + nodePostId;
      let innerText = ">>" + nodePostId + "";
      for (let i = 0; i < eles.length; i++) {
        let splitPostParts = eles[i].innerText.split("/");
        if (splitPostParts.length === 3) {
          let quotedPostId = Number(splitPostParts[1]);
          if (quotedPostId > 0) {
            let post = document.getElementById(quotedPostId);
            let yous = JSON.parse(localStorage.yous);
            let quotedPostNumber = board + "-" + quotedPostId;
            if (yous.includes(quotedPostNumber)) {
              eles[i].classList.add("you");
            }
            if (post) {
              let backlinkRepliesElements = post.getElementsByClassName("replies mt-5 ml-5");
              if (backlinkRepliesElements.length > 0) {
                let backlinkRepliesElement = backlinkRepliesElements[0];
                let backlinkReplies = backlinkRepliesElement.getElementsByClassName("quote");
                let backlinkDoesNotExist = true;
                for (let j = 0; j < backlinkReplies.length; j++) {
                  if (backlinkReplies[j].innerText == innerText) {
                    backlinkDoesNotExist = false;
                    break;
                  }
                }
                if (backlinkDoesNotExist) {
                  let backlink = document.createElement("a");
                  backlink.classList.add("quote");
                  backlink.href = constructedUrl;
                  backlink.innerText = innerText;
                  let span = document.createElement("span");
                  span.appendChild(document.createTextNode(" "));
                  span.appendChild(backlink);
                  backlinkRepliesElement.appendChild(span);
                }
              }
            }
          }
        }
      }
    }
  }

  function wrapNode(node) {
    let wrapper = document.createElement("div");
    wrapper.style.display = "inline-block";
    wrapper.style.maxWidth = "94%";
    wrapper.setAttribute("data-types", "post reply");
    node.parentElement.replaceChild(wrapper, node);
    wrapper.appendChild(node);
    wrapper.after(document.createElement("br"));
  }

  const updateNewPosts = function(list, observer, thread) {
    for(let mutation of list) {
      if (mutation.type === 'childList') {
        let idsForRefreshing = new Set()
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeName === "ARTICLE" && node.id !== "appendedNode") {
            setIdTextColor(node.getElementsByClassName("user-id"));
            assignIdUpdaterFunction(node.querySelectorAll(".user-id"));
            updateNumberOfPostsByIds(node.querySelectorAll(".user-id"), function(uid) { idsForRefreshing.add(uid); });
            updateIdCountersForUserIds(node.querySelectorAll(".user-id").values().map(e => e.innerText).toArray());
            updateQuotes(node, thread);
            wrapNode(node);

            hideAnonIfEnabled(node.parentElement);
            transformLinksInPosts(node);
          }
        })
        updateIdCountersForUserIds(idsForRefreshing);
      }
    }
  }
  let thread = GetSingleThreadOrNull();
  if (thread) {
    observer = new MutationObserver((l, o) => { updateNewPosts(l, o, thread); });
    observer.observe(thread, {childList:true}); // element to observe for changes, and conf
    setTimeout(function() {
      document.querySelectorAll(".replies.mt-5.ml-5").forEach(e => e.childNodes.forEach(e => e.remove()));
      document.querySelectorAll(".post-container").forEach(e => {
        if (e.nodeName === "ARTICLE") {
          updateQuotes(e, thread);
        }
      });
    }, 2000);
  }
}

function SetupEmbeddedCloudflare() {
  let thread = GetSingleThreadOrNull();
  if (thread) {
    thread = thread.getElementsByClassName("post-container op")[0];
    let threadId = thread.id;
    let board = thread.attributes.getNamedItem("data-board").value;
    let embedded = document.createElement("iframe");
    embedded.id = "GM_embeddedPage";
    embedded.type = "text/html";
    embedded.src = document.URL.split(board)[0];
    embedded.width = "500";
    embedded.height = "400";

    let buttonForEmbedding = document.createElement("button");
    buttonForEmbedding.id = "GM_toggleCloudflare";
    buttonForEmbedding.innerText = "Toggle Cloudflare authorization window";
    buttonForEmbedding.onclick = function() {
      let embeddedElement = document.getElementById("GM_embeddedPage");
      if (embeddedElement) {
        embeddedElement.remove();
      } else {
        this.parentElement.after(embedded);
      }
    };

    let div = document.createElement("div");
    div.appendChild(buttonForEmbedding);
    document.getElementById("livetext").after(div);

    if (GM) {
      var window = unsafeWindow;
    }

    let oldFetch = window.fetch;
    let newFetch = function(loc, options) {
      let r = oldFetch(loc, options).then(res => {
        if (loc.includes("/thread/" + threadId + "/refresh") && res.status === 403) {
          console.log("received " + res.status + " upon refreshing. Embedding cloudflare");
          if (!document.getElementById("GM_embeddedPage")) {
            document.getElementById("GM_toggleCloudflare").click();
          }
        }
        return res;
      });
      return r;
    }

    window.fetch = newFetch;
  }
}

async function ChangeRefreshTime() {
  if (GetSingleThreadOrNull()) {
    limitRefreshWait = Number(await GM.getValue("Settings.RefreshInterval", "600"));
  }
}

function addMissingHandlers() {
  if (typeof(hover_addHandlers) === "function") {
    if (typeof(overlay) === "object") {
      hover_addHandlers(overlay);
    }
  }
}

async function readyFn() {
  console.log("Running script");
  await SetupSettingsMenuItem();
  DecorateQuickReplyWithIds();
  await namefield();
  await initializePosterNamesWhitelist();
  await flagField(document.querySelector(".board-title")?.innerText.split("/")[1])
  await SetKeypressOnQr();
  SetupObserver();
  SetupEmbeddedCloudflare();
  await ChangeRefreshTime();
  setIdTextColor(document.getElementsByClassName("user-id"));
  assignIdUpdaterFunction(document.querySelectorAll(".user-id"));
  updateNumberOfPostsByIds(document.querySelectorAll(".user-id"), function(e) {} );
  addMissingHandlers();
  updateIdCountersForUserIds(document.querySelectorAll(".user-id").values().map(e => e.innerText).toArray())
  await hideAnonIfEnabled(GetSingleThreadOrNull());
  transformLinksInPosts(document);
  console.log("script finished executed");
}

return readyFn();
