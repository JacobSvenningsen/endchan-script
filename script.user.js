// ==UserScript==
// @name          endchan-script
// @version       1.0.2
// @namespace     endchan-script
// @author        JacobSvenningsen
// @description   Adds features and fixes functionality of endchan
// @grant         unsafeWindow
// @include       http://endchan.net/*
// @include       https://endchan.net/*
// @updateURL     https://github.com/JacobSvenningsen/endchan-script/raw/master/script.user.js
// @downloadURL   https://github.com/JacobSvenningsen/endchan-script/raw/master/script.user.js
// ==/UserScript==

function afterAjaxComplete(posts, lastCount) {
  //console.log("inside afterAjaxComplete")
  if (posts.length > lastCount) {
    //console.log("posts.length > lastCount")
    for (var i = lastCount; i < posts.length; i++) {
      //console.log("setting attribute")
      posts[i].setAttribute("loop", "true")
    }
  }  
  return posts.length
}

function setIdTextColor(count) {
  var eles = threadList.getElementsByClassName("labelId")
  for (var i = count; i < eles.length; i++) {
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
  return eles.length
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

function mouseoverfunc() {
  var newnode;
  if(this.tagName == "SPAN") { //video
    if (this.children[1].style.display != "none") {
      return
    }
    newnode = this.cloneNode(true)
    setNodeStyle(newnode)
    
    var src = document.createElement('source');
    var link = this.previousElementSibling.firstElementChild
    if (!link) {
      link = this.previousElementSibling.previousElementSibling.href
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
    
    newnode.children[1].appendChild(src)
    newnode.children[1].removeAttribute('controls')
    newnode.children[1].setAttribute('muted', true) 
    newnode.children[1].muted = true //If the video isn't forced to be muted, then some browsers refuse to autoplay the video
    newnode.children[2].remove()
    newnode.children[1].style.display = "inline"
    newnode.children[1].style.maxWidth = (innerWidth/100*95).toString() + "px"
    newnode.children[1].style.maxHeight = (innerHeight/100*95).toString() + "px"
    newnode.children[1].style.width = "auto"
    newnode.children[1].style.height = "auto"
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

function readyFn() {
  var lastImgCount = 0
  var imgCount = 0
  var idCount = 0
  var numPosts = threadList.getElementsByClassName("divMessage").length
  var namefield = document.getElementById("fieldName")
  namefield.value = localStorage.getItem("namefield");
  if (GM) {
    var window = unsafeWindow
  }
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
  document.body.firstElementChild.appendChild(ele)

  afterAjaxComplete(threadList.getElementsByTagName("video"), lastImgCount)
  if (window.show_quick_reply) {
    window.show_quick_reply()
    qrname.value = localStorage.getItem("namefield")
    qrname.oninput = function() {
      localStorage.setItem("namefield", qrname.value)
    }
  }
  namefield.oninput = function() {
    localStorage.setItem("namefield", namefield.value)
  }

  var oldXHR = window.XMLHttpRequest;

  function newXHR() {
    var realXHR = new oldXHR();
    realXHR.addEventListener("readystatechange", function() {
      if(realXHR.readyState==4 && realXHR.status==200) {
        setTimeout(function() {
          lastImgCount = afterAjaxComplete(threadList.getElementsByTagName("video"), lastImgCount)
          applyHoverImgEvent()
          insertBreak()
          idCount = setIdTextColor(idCount)
        }, 1000)
      }
    }, false);
    return realXHR;
  }
  window.XMLHttpRequest = newXHR;

  function insertBreak() {
    var eles = threadList.getElementsByClassName("divMessage")
    for (var i = numPosts; i < eles.length; i++) {
      eles[i].before(document.createElement("div"))
    }
    numPosts = eles.length
  }

  function applyHoverImgEvent() {
    var eles = threadList.getElementsByClassName("uploadCell")
    for (var i = imgCount; i < eles.length; i++) {
      eles[i].lastElementChild.onmouseover = mouseoverfunc
      eles[i].lastElementChild.onmouseout = mouseoutfunc
    };
    imgCount = eles.length;
  }
  applyHoverImgEvent()
  idCount = setIdTextColor(idCount)
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

