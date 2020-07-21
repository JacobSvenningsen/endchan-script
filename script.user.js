// ==UserScript==
// @name          endchan-script
// @version       1.2.13
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

  if (link.endsWith(".webm")) {
    src.setAttribute('type', 'video/webm');
  } else if (link.endsWith(".mp4")) {
    src.setAttribute('type', 'video/mp4');
  } else if (link.endsWith(".ogg")) {
    src.setAttribute('type', 'video/ogg');
  }

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
    '#settingsWindow.opened { \
      display:block !important; \
      position:fixed; \
      top: 50%; \
      left: 50%; \
      width:30em; \
      height:18em; \
      margin-top: -9em; \
      margin-left: -15em; \
      border: solid 1px; \
      z-index: 101; \
    } \
    \
    #settingsWindow.opened h1 { \
        text-align:center; \
    } \
    \
    #settingsWindow.opened .settings { \
        width:90%; \
    } \
    \
    #settingsOverlay { \
        position:fixed; \
        top:0px; \
        left:0px; \
        width:100%; \
        height:100%; \
        background-color: rgba(0,0,0,0.4); \
        z-index:100; \
    }'
  return style
}

function qrShortcutsSettingOnclick() {
  if (localStorage.getItem("qrshortcuts") == "false") {
    document.onkeydown = KeyPress
    localStorage.setItem("qrshortcuts", true)
  } else {
    document.onkeydown = null
    localStorage.setItem("qrshortcuts", false)
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
        for (var i = 0; i < imgs.length; i++) {
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
      image_thumbs_settings.innerText = '/*\
      a.imgLink img:not([class="imgExpanded"]), \
      .uploadCell span img:not([class="imgExpanded"]){ \
        height: auto; \
        width: auto; \
        max-width: 125px; \
        max-height: 125px; \
      }*/'
    } else {
      localStorage.setItem("smallThumbs_enabled", "true")
      image_thumbs_settings.innerText = ' \
      a.imgLink img:not([class="imgExpanded"]), \
      .uploadCell span img:not([class="imgExpanded"]){ \
        height: auto; \
        width: auto; \
        max-width: 125px; \
        max-height: 125px; \
      }'
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
              if(realXHR.readyState==4 && realXHR.status==404) {
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
      checked = defaultCheck
      localStorage.setItem(item, checked)
    } else if (checked == "false") {
      checked = false
    } else {
      checked = true
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
  
  settingsScreen.appendChild(createSettingOption("Post Inlining", "postInlining", togglePostInlining, true))
  settingsScreen.appendChild(createSettingOption("Quick Reply Shortcuts", "qrshortcuts", qrShortcutsSettingOnclick, false))
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
  settingsBox.style.display = "none"
  settingsBox.style.zIndex = "100"
  document.body.after(settingsBox)
  
  let overlay = document.createElement("div")
  overlay.id = "settingsOverlay"
  overlay.style.display = "none"
  overlay.onclick = function() {this.style.display = "none"; settingsWindow.classList.toggle("opened")}
  
  settingsWindow.before(overlay)
  
  ele.onmousedown = function(e) {
    settingsBox.classList.toggle("opened")
    settingsOverlay.style.display = "block"
    e.preventDefault()
    e.stopPropagation()
  }
  
  return ele
}

function namefield(window) {
  if (document.getElementById("fieldName") !== null) {
    fieldName.value = localStorage.getItem("namefield");
    if (window.show_quick_reply) {
      window.show_quick_reply()
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
  namefield(window)

  function setLoop(posts) {
    for (var i = 0; i < posts.length; i++) {
      posts[i].setAttribute("loop", "true")
    }
  }

  function applyHoverImgEvent(eles) {
    if (localStorage.getItem("hover_enabled") == "true") {
      for (var i = 0; i < eles.length; i++) {
        eles[i].lastElementChild.onmouseover = mouseoverfunc
        eles[i].lastElementChild.onmouseout = mouseoutfunc
      };
    }
  }
  
  function insertBreak(eles) {
    for (var i = 0; i < eles.length; i++) {
      eles[i].before(document.createElement("div"))
    }
  }
  
  function setIdTextColor(eles) {
    for (var i = 0; i < eles.length; i++) {
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
    for(var i = 0; i < nodes.length; i++) {
      nodes[i].onclick = function(e) {
        var toQuote = this.innerText;

        if (typeof add_quick_reply_quote != "undefined") {
          if (!document.getElementById("qrbody") && window.show_quick_reply) {
            window.show_quick_reply()
          }
          if (document.getElementById("qrbody")) {
            let selection = window.getSelection().toString()
            // where we paste in quote and marked text. 3 indicates the quote sign ">>" and '\n'
            let pos = qrbody.selectionStart + e.target.innerText.length + selection.length + 3
            if (selection.length > 0) {
              pos += 2 // post is surely marked. Add 2 for '>' + '\n'
            }
            for (let i = 0; i < selection.length-1; i++) { //each additional newline requires position to be moved by 1 more. Newline already part of selection
              if (selection[i] === '\n') {
                pos += 1 // '>'
              }
            }
            add_quick_reply_quote(toQuote);
            qrbody.focus()
            qrbody.selectionStart = pos
            qrbody.selectionEnd = pos
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
    for(var i = 0; i < newPics.length; i++) {
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
      for (var i = 0; i < links.length; i++) {
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
      for (var i = 0; i < links.length; i++) {
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
    for (var i = 0; i < quotes.length; i++) {
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
    replaceLinkQuoting(threadList.getElementsByClassName("linkQuote"))
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
        for (var i = 0; i < items.length; i++) {
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
    }
    addCounters()
    if (document.getElementById("divPosts")) {
      divPosts.childNodes.forEach(addHideUserPosts)
      divPosts.childNodes.forEach(hideThisPost)
    } else {
      var eles = document.getElementsByClassName("divPosts")
      for (var i = 0; i < eles.length; i++) {
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

function insertAtCaret(open, close) {
  var startPos = qrbody.selectionStart;
  var endPos = qrbody.selectionEnd;
  var scrollTop = qrbody.scrollTop;
  var marked_text = "";
  for (var i = qrbody.selectionStart; i < qrbody.selectionEnd; i++) {
    marked_text += qrbody.value[i]
  }
  qrbody.value = qrbody.value.substring(0, startPos) + open + marked_text + close + qrbody.value.substring(endPos, qrbody.value.length);
  qrbody.focus();
  qrbody.selectionStart = startPos + open.length;
  qrbody.selectionEnd = startPos + open.length + marked_text.length;
  qrbody.scrollTop = scrollTop;
};

function KeyPress(e) { //Adds quick shortcuts for markup and posting
  var evtobj = window.event? event : e

  if (evtobj.ctrlKey) {
    if (evtobj.shiftKey && evtobj.keyCode == 70) { //code shift+F
        insertAtCaret("[code]","[/code]");
        e.preventDefault();     
        e.stopPropagation(); 
    } else {
      switch(evtobj.keyCode) {
        case 13: //submit ENTER
          document.getElementById("qrbutton").click();
          break;
        case 83: //spoiler S
          insertAtCaret("**","**");
          e.preventDefault();     
          e.stopPropagation();
          break;
        case 73: //italics I
          insertAtCaret("''","''");
          e.preventDefault();     
          e.stopPropagation();
          break;
        case 66: //bold B
          insertAtCaret("'''","'''");
          e.preventDefault();     
          e.stopPropagation();
          break;
        case 85: //underline U
          if (!evtobj.shiftKey) {
            insertAtCaret("__","__");
            e.preventDefault();     
            e.stopPropagation();
          }
          break;
        case 68: //strikethrough D
          insertAtCaret("~~","~~");
          e.preventDefault();     
          e.stopPropagation();
          break;
        case 82: //big letters R
          insertAtCaret("==","==");
          e.preventDefault();     
          e.stopPropagation();
          break;
        default:
          break;
      }
    }
  }
}

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
  document.firstElementChild.appendChild(styleForSettingsWindow())
  document.firstElementChild.appendChild(imageThumbsStyle())
  if (localStorage.getItem("qrshortcuts") == "true") {
    document.onkeydown = KeyPress
  } else {
    document.onkeydown = null
  }
  console.log("done injecting css")
}).call();


