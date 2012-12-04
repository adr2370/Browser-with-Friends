  /************************************************************************************
  This is your Page Code. The appAPI.ready() code block will be executed on every page load.
  For more information please visit our docs site: http://docs.crossrider.com
*************************************************************************************/
var accessToken="";
var user="";
var currentSession="";
var pubnub;
var sessionOwner="";
var opened="true";
var apiKey = "11640702"; // Replace with your API key. See https://dashboard.tokbox.com/projects
var apiSecret = "599049e15f15f93bf46c991afe2553404a606d7d"; // Replace with your API key. See https://dashboard.tokbox.com/projects
var sessionId = ""; // Replace with your own session ID. See https://dashboard.tokbox.com/projects
var token = ''; // Replace with a generated token. See https://dashboard.tokbox.com/projects
var videoCount = 0;

var session;
var publisher;
var subscribers = {};
var VIDEO_WIDTH = 140;
var VIDEO_HEIGHT = 105;

appAPI.ready(function($) {
	appAPI.$=$;
	if(window.location.href.substring(0,22)!="http://crossrider.com/") {
		sessionId=appAPI.db.get("session");
	appAPI.resources.includeRemoteJS('https://static.firebase.com/v0/firebase.js');
	appAPI.resources.includeRemoteJS('http://static.opentok.com/webrtc/v2.0/js/TB.min.js');
	appAPI.TB=TB;
	appAPI.resources.includeRemoteJS('http://cdn.pubnub.com/pubnub-3.1.min.js');
	$('head').append('<style type="text/css">button.css3button {font-family: Arial, Helvetica, sans-serif;font-size: 18px;color: #000000;padding: 5px 10px;background: -moz-linear-gradient(top,#fff3db 0%,#ff0000 25%,#ff3c00);background: -webkit-gradient(linear, left top, left bottom, from(#fff3db),color-stop(0.25, #ff0000),to(#ff3c00));-moz-border-radius: 6px;-webkit-border-radius: 6px;border-radius: 6px;border: 1px solid #b85f00;-moz-box-shadow:0px 1px 3px rgba(000,000,000,0.5),inset 0px -1px 0px rgba(255,255,255,0.7);-webkit-box-shadow:0px 1px 3px rgba(000,000,000,0.5),inset 0px -1px 0px rgba(255,255,255,0.7);box-shadow:0px 1px 3px rgba(000,000,000,0.5),inset 0px -1px 0px rgba(255,255,255,0.7);text-shadow:0px -1px 1px rgba(000,000,000,0.2),0px 1px 0px rgba(255,255,255,0.3);}</style> ');
	$('body').prepend('<div id="stuff"><img id="arrow" src="'+appAPI.resources.getImage('arrowup.png')+'" width="30px" style="position:absolute;top:0px;right:0px;"></div>');
	$('#stuff').attr('style','border: 1px solid black;position: fixed; background: white;z-index: 10000;display: block; width: 300px;margin: 0;overflow-y:scroll !important;overflow-x:hidden; top: 0px;right: 0px;height:100%;text-align: left;');
	$('#stuff').prepend('<div id="login" style="margin-top:7px;margin-left:8px;margin-bottom:10px;margin-right:15px;"></div>');
	var services=new Array("dropbox","facebook","fitbit","flickr","foursquare","github","google","instagram","linkedin","meetup","rdio","runkeeper","stocktwits","tout","tumblr","twitter","wordpress","youtube");
	for(var i=0;i<services.length;i++) {
		var c=services[i];
		$('#login').append('<div style="float: left;margin-right: 8px;margin-bottom:2px;width: 30px;"><a href="https://api.singly.com/oauth/authorize?client_id=12d5b0ecb16b174eecb8c823e9c95211&service='+c+'&redirect_uri='+window.location.href+'&response_type=token"><img src="'+appAPI.resources.getImage(c+'-32x32.png')+'"</a></div>');
	}
	$("#arrow").hover(
  		function () {
  			$("#arrow").css( 'cursor', 'pointer' );
  		}, 
  		function () {
  			$("#arrow").css( 'cursor', 'default' );
  		}
	);
	$('#arrow').click(function () {
		if($('#stuff').width()<=50) {
			//user opened the app
			opened='true';
	      	$('#stuff').children().show();
      		$('#stuff').animate({ width:'300px' }, { queue: false, duration: 500, complete: function() {
      			$('#arrow').attr('src',appAPI.resources.getImage('arrowup.png'));
	      		if(opened=='true'&&currentSession.length>0) {
	    			joinRoom(currentSession,sessionOwner);
	    		}
      			heightResize();
      		} });
      		$('#stuff').animateAuto('height', 500, heightResize);
      		$('#stuff').attr('style', function(i,s) { return s + 'overflow-y: scroll !important;' });
      	} else {
      		opened='false';
			//user closed the app
      			$('#stuff').attr('style', function(i,s) { return s + 'overflow-y: hidden !important;' });
      		$('#stuff').animate({ width:'30px' }, { queue: false, duration: 500, complete: function() {
      			$('#stuff').children().hide();
				$('#arrow').show();
      			$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
      			var tempSession=currentSession;
      			leaveRoom();
      			currentSession=tempSession;
      		} });
      		$('#stuff').animate({ height:'30px' }, { queue: false, duration: 500 });
		}
		appAPI.db.set("opened", opened);
    });
    if(getHashVariable('access_token')!=null) {
    	appAPI.db.set("access_token", getHashVariable('access_token'));
    }
    currentSession=appAPI.db.get("currentSession");
    sessionOwner=appAPI.db.get("sessionOwner");
    accessToken=appAPI.db.get("access_token");
    opened=appAPI.db.get("opened");
    var myVar=setInterval(function(){findTokbox()},200);
	if(accessToken) {
		$("#stuff").append('<button type="button" id="makeRoom" class="css3button" style="margin-top: 0px; float: left; width: 109px; height: 32px; font-size: 14px;margin-bottom: 8px;">Make Room</button>');
	    $("#makeRoom").hover(
	  		function () {
	  			$("#makeRoom").css( 'cursor', 'pointer' );
	  		}, 
	  		function () {
	  			$("#makeRoom").css( 'cursor', 'default' );
	  		}
		);
		$("#makeRoom").click(function () {
			createRoom();
	  	});
	    appAPI.request.get(
	        "https://api.singly.com/profiles?access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            user = jQuery.parseJSON(response).id;
	        },
	        function() {
	            console.log("Failed to retrieve content.");
	    });
    }
    if(opened=='true'&&currentSession.length>0) {
    	joinRoom(currentSession,sessionOwner);
    }
	$('#stuff').attr('style', function(i,s) { return s + 'overflow-y: hidden !important;' });
  	$('#stuff').width(30);
  	$('#stuff').children().hide();
	$('#arrow').show();
  	$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
  	$('#stuff').height(30);
    if(opened=='true') {
    	$('#arrow').click();
    }
	}
});
function createRoom() {
    myDataRef = new Firebase('https://browserwithfriends.firebaseIO.com/');
    appAPI.request.get(
        "https://api.singly.com/profile?access_token="+accessToken,
        function(response, headers) {
            // Display the response
            var username = jQuery.parseJSON(response).name;
            var thumbnail = jQuery.parseJSON(response).thumbnail_url;
        	var numberToSend=appAPI.db.get("session");
			appAPI.db.set("sessionOwner", sessionOwner);
			appAPI.db.set("currentSession", numberToSend);
		    var d = new Date();
		    appAPI.request.post(
		        "https://browserwithfriends.firebaseIO.com/"+user+".json",
		        // Data to post
		        '{"openTok":"'+numberToSend+'", "username":"'+username+'", "thumbnail":"'+thumbnail+'", "time":'+d.getTime()+'}',
		        function(response) {
		        	console.log(response);
		        },
		        function() {
		        	console.log("Failed to post stuff3");
		    });
		    joinRoom(numberToSend,username);
        },
        function() {
            console.log("Failed to retrieve content.");
	});
}
function leaveRoom() {
	token="";
	disconnect();
	appAPI.$('.byeByeStreams').remove();
	videoCount=0;
	var currSess=currentSession;
	appAPI.request.get(
	        "https://api.singly.com/profile?access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            var username = jQuery.parseJSON(response).name;
				if(username==sessionOwner) {
					var d = new Date();
					appAPI.request.post(
				        "https://browserwithfriends.firebaseIO.com/"+user+".json",
				        // Data to post
				        '{"openTok":"'+currSess+'", "username":"done", "thumbnail":"done", "time":'+d.getTime()+'}',
				        function(response) {
				        	console.log(response);
				        },
				        function() {
				        	console.log("Failed to post stuff4");
				    });
				}
				pubnub.publish({
					 channel : currSess, message : username+' has left the chat'
					 });
				pubnub.unsubscribe({ channel : currSess });
	        }
	);
	appAPI.db.set("currentSession", "");
	appAPI.db.set("currentChat", "");
	appAPI.$('#chat').slideUp(400, function() {
	    appAPI.$('#chat').empty().remove();
  });
	appAPI.$("#makeRoom").text("Make Room");
	appAPI.$("#makeRoom").unbind('click');
    appAPI.$("#makeRoom").click(function () {
		createRoom();
  	});
	currentSession="";
	heightResize();
}
function joinRoom(numberToSend,uname) {
	if(token!="") { return; }
	getToken(numberToSend);
	sessionOwner=uname;
	appAPI.db.set("sessionOwner", sessionOwner);
	currentSession=numberToSend;
	    appAPI.$('.otherRooms').remove();
	    appAPI.$("#stuff").append('<div id="chat" style="font-size: 14px;clear:both;margin-bottom:10px;margin-left:9px;"><div><input id="wordsPutHere" style="font-size: 14px;width: 87%;margin-top: 4px;margin-bottom: 7px;" id=input placeholder="Type here" /></div><div id=box>'+appAPI.db.get("currentChat")+'</div></div>');
		appAPI.$("#chat").hide().slideDown();
	appAPI.db.set("currentSession", numberToSend);
	appAPI.$("#makeRoom").text("Leave Room");
	appAPI.$("#makeRoom").unbind('click');
	appAPI.$("#makeRoom").click(function () {
		leaveRoom();
  	});
	if(appAPI.db.get("currentChat")==null) {
		appAPI.db.set("currentChat", "");
	}
    pubnub = PUBNUB.init({
        'publish_key'   : 'pub-ab79edde-8e3c-44aa-b5a2-bd89aa4a8486',
        'subscribe_key' : 'sub-ad68df02-3c54-11e2-a187-09e3f2bc4914',
        'origin'		: 'pubsub.pubnub.com',
        'ssl'           : false
    });
    var box = PUBNUB.$('box'), input = PUBNUB.$('input'), channel = 'chat';
    pubnub.ready();
    pubnub.subscribe({
        channel : numberToSend,
        callback : function(text) {
        	if(text!=null) {
        	text=urlify((''+text).replace( /[<>]/g, '' ));
        	box.innerHTML = text + '<br>' + box.innerHTML;
			appAPI.db.set("currentChat", appAPI.$('#box').html());
			heightResize();
        	if(text==sessionOwner+" has left the chat") {
	        	box.innerHTML = 'You will now be disconnected<br>' + box.innerHTML;
        		window.setTimeout(leaveRoom, 2000);
        	}
        	}
        }
    });
		pubnub.bind( 'keyup', wordsPutHere, function(e) {
		 (e.keyCode || e.charCode) === 13 && pubnub.publish({
		 channel : numberToSend, message : appAPI.$('#wordsPutHere').val(), x : (appAPI.$('#wordsPutHere').val(''))
		 });
	});
	appAPI.request.get(
	        "https://api.singly.com/profile?access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            var username = jQuery.parseJSON(response).name;
				pubnub.publish({
					 channel : numberToSend, message : username+' has joined the chat'
					 });
	        }
	);
	heightResize();
}
function findTokbox() {
	if(currentSession!='') { return; }
    var peers=new Array();
    myDataRef = new Firebase('https://browserwithfriends.firebaseIO.com/');
    if(accessToken) {
	    appAPI.request.get(
	        "https://api.singly.com/friends/peers/?sort=interactions&access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            var allFriends = jQuery.parseJSON(response);
	            for(var i=0;i<allFriends.length;i++) {
	            	var peer=allFriends[i].peer;
				    appAPI.request.get(
				        "https://browserwithfriends.firebaseIO.com/"+peer+".json",
				        function(response) {
	            			var session = jQuery.parseJSON(response);
	            			var currentRoom = "";
	            			var userName = "";
	            			var currentTime = 0;
	            			for(var x in session) {
	            				if(session[x].time>currentTime) {
		            				currentRoom=session[x].openTok;
									userName=session[x].username;
									thumbnail=session[x].thumbnail;
									currentTime=session[x].time;
	            				}
							}
							if(userName=='done') {
								appAPI.$('#'+currentRoom).empty();
								appAPI.$('#'+currentRoom).remove();
							} else if(currentSession==''&&currentRoom!=''&&currentRoom!='done'&&appAPI.$('#'+currentRoom).length==0) {
								appAPI.$("#stuff").append('<a id="'+currentRoom+'" class="otherRooms" style="margin-right: 29px; clear: both;margin-bottom: 5px;float: right;"><div style=" display: inline-block; position: relative; top: -17px; font-size: 19px; ">'+userName+'</div><img src="'+thumbnail+'" style="height: 50px;margin-left: 5px;"></button>');
								appAPI.$("#"+currentRoom).hide().slideDown();
					        	appAPI.$("#"+currentRoom).hover(
						  		function () {
						  			appAPI.$("#"+currentRoom).css( 'cursor', 'pointer' );
						  		}, 
						  		function () {
						  			appAPI.$("#"+currentRoom).css( 'cursor', 'default' );
						  		}
							);
							appAPI.$("#"+currentRoom).click(function () {
								joinRoom(this.id,this.text);
						  	});
							heightResize();
							}
				        },
				        function() {
				        	console.log("Failed to post stuff1");
				    });
	            }
	        },
	        function() {
	            console.log("Failed to retrieve content.");
	    });
    }
}
function getHashVariable(name) {
	var s=window.location.hash.substring(1);
	var stuff=s.split("&");
	for (i=0;i<stuff.length;i++) {
		var split=stuff[i].split("=");
		if(split[0]==name) {
			return split[1];
		}
	}
	return null;
}
function heightResize() {
	appAPI.$('#stuff').height('auto');
	if(appAPI.$('#stuff').height()>appAPI.$(window).height()) {
		appAPI.$('#stuff').height('100%');
	}
	appAPI.$('.OT_video-container').css('position','static');
}
function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
    	var lastFour=url.substring(url.length-4,url.length);
    	var lastThree=url.substring(url.length-3,url.length);
    	if(lastFour=='jpeg'||lastThree=='gif'||lastThree=='jpg'||lastThree=='png') {
    		return '<a href="' + url + '" target="_blank"><img src="' + url + '" width="270px"/></a>';
    	} else {
        	return '<a href="' + url + '" target="_blank">' + url + '</a>';
    	}
    })
}
jQuery.fn.animateAuto = function(prop, speed, callback){
    var elem, height, width;
    return this.each(function(i, el){
        el = jQuery(el), elem = el.clone().css({"height":"auto","width":"300px"}).appendTo("body");
        height = elem.css("height"),
        width = elem.css("width"),
        elem.remove();
        if(prop === "height") 
        	el.animate({"height":height}, speed, callback);
        else if(prop === "width")
            el.animate({"width":width}, speed, callback);  
        else if(prop === "both")
            el.animate({"width":width,"height":height}, speed, callback);
    });  
}
function getToken(sessh) {
	appAPI.request.get(
	        "https://api.singly.com/profiles?access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            user = jQuery.parseJSON(response).id;
				appAPI.request.post(
			        "http://songtb.herokuapp.com/stringgeneratetoken",
			        // Data to post
			        '{"key":"'+apiKey+'", "secret":"'+apiSecret+'", "session":"'+sessh+'", "data":"'+user+'"}',
			        function(response) {
			        	token=jQuery.parseJSON(response).token;
						appAPI.db.set("token", token);
						beginSession(sessh);
			        },
			        function(e) {
			        	console.log(e);
			    });
	        },
	        function() {
	            console.log("Failed to retrieve content.");
	    });
}
function beginSession(sessh) {
	appAPI.TB.addEventListener("exception", exceptionHandler);
	// Un-comment the following to set automatic logging:
	// TB.setLogLevel(TB.DEBUG);
	
	if (appAPI.TB.checkSystemRequirements() != appAPI.TB.HAS_REQUIREMENTS) {
		alert("You don't have the minimum requirements to run this application. Please upgrade to the latest version of Flash.");
	} else {
		session = appAPI.TB.initSession(sessh);	// Initialize session
	
		// Add event listeners to the session
		session.addEventListener('sessionConnected', sessionConnectedHandler);
		session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
		session.addEventListener('connectionCreated', connectionCreatedHandler);
		session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
		session.addEventListener('streamCreated', streamCreatedHandler);
		session.addEventListener('streamDestroyed', streamDestroyedHandler);
		connect();
	}
}

//--------------------------------------
//  LINK CLICK HANDLERS
//--------------------------------------

/*
If testing the app from the desktop, be sure to check the Flash Player Global Security setting
to allow the page from communicating with SWF content loaded from the web. For more information,
see http://www.tokbox.com/opentok/build/tutorials/helloworld.html#localTest
*/
function connect() {
	session.connect(apiKey, token);
}

function disconnect() {
	if(session!=undefined) {
		stopPublishing();
		session.disconnect();
	}
}

// Called when user wants to start publishing to the session
function startPublishing() {
	if (!publisher) {
		var parentDiv = appAPI.$("#stuff");
		var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace
		publisherDiv.setAttribute('id', 'opentok_publisher');
		publisherDiv.setAttribute('style', 'position: fixed;height: 105px;overflow: hidden;width: 140px;top: 5px;right: 310px;z-index: 100000;');
		parentDiv.before(publisherDiv);
		var publisherProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT};
		publisher = appAPI.TB.initPublisher(apiKey, publisherDiv.id, publisherProps);  // Pass the replacement div id and properties
		session.publish(publisher);
		heightResize();
		videoCount++;
	}
}

function stopPublishing() {
	if (publisher) {
		session.unpublish(publisher);
	}
	publisher = null;
}

//--------------------------------------
//  OPENTOK EVENT HANDLERS
//--------------------------------------

function sessionConnectedHandler(event) {
	// Subscribe to all streams currently in the Session
	startPublishing();
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i]);
	}
}

function streamCreatedHandler(event) {
	// Subscribe to the newly created streams
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i]);
	}
}

function streamDestroyedHandler(event) {
	// This signals that a stream was destroyed. Any Subscribers will automatically be removed.
	// This default behaviour can be prevented using event.preventDefault()
	videoCount--;
}

function sessionDisconnectedHandler(event) {
	// This signals that the user was disconnected from the Session. Any subscribers and publishers
	// will automatically be removed. This default behaviour can be prevented using event.preventDefault()
	publisher = null;
}

function connectionDestroyedHandler(event) {
	// This signals that connections were destroyed
}

function connectionCreatedHandler(event) {
	// This signals new connections have been created.
}

/*
If you un-comment the call to TB.setLogLevel(), above, OpenTok automatically displays exception event messages.
*/
function exceptionHandler(event) {
	alert("Exception: " + event.code + "::" + event.message);
}

//--------------------------------------
//  HELPER METHODS
//--------------------------------------

function addStream(stream) {
	// Check if this is the stream that I am publishing, and if so do not publish.
	console.log(subscribers);
	if (stream.connection.connectionId == session.connection.connectionId||stream.connection.data==user) {
		return;
	}
	var parentDiv = appAPI.$("#stuff");
	var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace
	publisherDiv.setAttribute('id', stream.streamId);
	publisherDiv.setAttribute('class', 'byeByeStreams');
	console.log(subscribers);
	var topLocation=videoCount*110+5;
	publisherDiv.setAttribute('style', 'position: fixed;height: 105px;overflow: hidden;width: 140px;top: '+topLocation+'px;right: 310px;z-index: 100000;');
	parentDiv.before(publisherDiv);
	var subscriberProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT};
	subscribers[stream.streamId] = session.subscribe(stream, stream.streamId, subscriberProps);
	heightResize();
	videoCount++;
}