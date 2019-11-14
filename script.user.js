// ==UserScript==
// @name          endchan-script
// @version       1.0.12
// @namespace     endchan-script
// @author        JacobSvenningsen
// @description   Adds features and fixes functionality of endchan
// @grant         unsafeWindow
// @include       http://endchan.net/*
// @include       https://endchan.net/*
// @updateURL     https://github.com/JacobSvenningsen/endchan-script/raw/master/script.user.js
// @downloadURL   https://github.com/JacobSvenningsen/endchan-script/raw/master/script.user.js
// ==/UserScript==

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
    removeElement(this)
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

function qrShortcutElement() {
  var ele = document.createElement("a")
  ele.innerText = localStorage.getItem("qrshortcuts")
  if (ele.innerText == "") {
    localStorage.setItem("qrshortcuts", false)
  } else if (ele.innerText == "true") {
    document.onkeydown = KeyPress
  }
  ele.style.position = "absolute"
  ele.style.right = "0px"
  ele.style.cursor = "pointer"
  ele.innerText = (localStorage.getItem("qrshortcuts") == "true") ? "disable qr shortcuts" : "enable qr shortcuts"
  ele.onmousedown = function() {
    if (localStorage.getItem("qrshortcuts") == "false") {
      ele.innerText = "disable qr shortcuts"
      document.onkeydown = KeyPress
      localStorage.setItem("qrshortcuts", true)
    } else {
      ele.innerText = "enable qr shortcuts"
      document.onkeydown = null
      localStorage.setItem("qrshortcuts", false)
    }
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
    }
    fieldName.oninput = function() {
      localStorage.setItem("namefield", fieldName.value)
    }
  }
}

function readyFn() {
  if (GM) {
    var window = unsafeWindow
  }
  
  document.body.firstElementChild.appendChild(qrShortcutElement())
  namefield(window)

  function setLoop(posts) {
    for (var i = 0; i < posts.length; i++) {
      posts[i].setAttribute("loop", "true")
    }
  }

  function applyHoverImgEvent(eles) {
    for (var i = 0; i < eles.length; i++) {
      eles[i].lastElementChild.onmouseover = mouseoverfunc
      eles[i].lastElementChild.onmouseout = mouseoutfunc
    };
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
    }
  }
  
  function hidePost(ele) {
    Object.entries(localStorage).forEach(function(entry) {
      var name = ele.getElementsByClassName("labelId")[0]
      if (name) {
        name = name.innerText.slice(0,6)
        if (entry[0] == ("hide"+boardUri+"User"+name) && entry[1] == "true") {
          ele.style.display = "none"
          if (ele.nextElementSibling === null) {
            ele.after(document.getElementById("Show"+boardUri+"User"+name))
          } else {
            try {
              if (document.getElementById("Show"+boardUri+"User"+name) !== null && ele.nextElementSibling.id != ("Show"+boardUri+"User"+name)) {
                ele.after(document.getElementById("Show"+boardUri+"User"+name))
              }
            } catch(err) {
              
            }
          }
        }
      }
    })
  }
  
  function replaceLinkQuoting(nodes) {
    for(var i = 0; i < nodes.length; i++) {
      nodes[i].removeAttribute("href")
      nodes[i].style.cursor = "pointer"
      nodes[i].onclick = function() {
        var toQuote = this.innerText;

        if (typeof add_quick_reply_quote != "undefined") {
          add_quick_reply_quote(toQuote);
        }

        document.getElementById('fieldMessage').value += '>>' + toQuote + '\n';
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
      quote.removeAttribute("href")
      quote.style.cursor = "pointer"
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
            updateLinks(clonedNode, "quoteLink", true)
            updateLinks(clonedNode, "panelBacklinks", true)
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
    }
  }
  
  function embeddedLinkHover(e) {
    var node = document.getElementById(this.innerText.slice(2).split(" ")[0]).cloneNode(true);
    node.id = "appendedNode"
    node.style.position = "fixed"
    node.style.top = e.clientY + 'px'
    node.style.left = e.clientX + 10 + 'px'
    var id = node.getElementsByClassName("labelId")[0]
    if (id) {
      id.classList.remove("labelId")
    }
    threadList.getElementsByClassName("divPosts")[0].appendChild(node)
  }
  
  function updateLinks(parent, linkStr, updateEvents) {
    var links = parent.getElementsByClassName(linkStr)
    if (linkStr == "quoteLink") {
      for (var i = 0; i < links.length; i++) {
        if (updateEvents) { 
          links[i].onmouseenter = embeddedLinkHover 
          links[i].onmouseout = function() { document.getElementById("appendedNode").remove() }
        }
        insertInlinePost(links[i])
      }
    } else {
      for (var i = 0; i < links.length; i++) {
        links[i].childNodes.forEach(function(quote) { 
          if (updateEvents) { 
            quote.onmouseenter = embeddedLinkHover
            quote.onmouseout = function() { document.getElementById("appendedNode").remove() }
          }
          insertInlinePost(quote);
        })
      }
    }
  }
  
  function updateNewlyCreatedBacklinks(node) {
    var quotes = node.getElementsByClassName("quoteLink")
    for (var i = 0; i < quotes.length; i++) {
      var backlinks = document.getElementById(quotes[i].innerText.slice(2).split(" ")[0]).getElementsByClassName("panelBacklinks")
      for (var j = 0; j < backlinks.length; j++) {
        backlinks[j].childNodes.forEach(insertInlinePost)
      }
    }
  }
  
  const updateNewPosts = function(list, observer) {
    for(let mutation of list) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          setLoop(node.getElementsByTagName("video"))
          applyHoverImgEvent(node.getElementsByClassName("uploadCell"))
          insertBreak(node.getElementsByClassName("divMessage"))
          setIdTextColor(node.getElementsByClassName("labelId"))
          replaceLinkQuoting(node.getElementsByClassName("linkQuote"))
          hidePost(node)
          updateLinks(node, "quoteLink")
          updateNewlyCreatedBacklinks(node)
        })
      }
    }
  }

  if (document.getElementById("threadList")) {
    setLoop(threadList.getElementsByTagName("video"))
    applyHoverImgEvent(threadList.getElementsByClassName("uploadCell"))
    setIdTextColor(threadList.getElementsByClassName("labelId"))
    if (document.getElementById("divPosts")) {
      divPosts.childNodes.forEach(hidePost)
    } else {
      var eles = document.getElementsByClassName("divPosts")
      for (var i = 0; i < eles.length; i++) {
        eles[i].childNodes.forEach(hidePost)
      }
    }
    replaceLinkQuoting(threadList.getElementsByClassName("linkQuote"))
    updateLinks(threadList, "panelBacklinks")
    updateLinks(threadList, "quoteLink")
    observer = new MutationObserver(updateNewPosts)
    observer.observe(threadList.getElementsByClassName("divPosts")[0], {childList:true}) // element to observe for changes, and conf
  }
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
        qrbody.insertAtCaret("[code]","[/code]");
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

(function() { //fixes post counter and in turn, also post hiding
  var orig = document.getElementsByClassName.bind(document);
  document.getElementsByClassName = (function(str) {
      if (str == "labelId") {
          return threadList.getElementsByClassName('labelId');
      } else {
          return orig(str);
      }
  });
}).call();


