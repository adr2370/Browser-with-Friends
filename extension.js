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
var username="";

var scrollListener;

appAPI.ready(function($) {
	appAPI.$=$;
	if(window.location.href.substring(0,22)!="http://crossrider.com/") {
	scrollListener = function() {
		checkBorder();
	};
	window.addEventListener('scroll', scrollListener, false);
	appAPI.resources.includeRemoteJS('https://static.firebase.com/v0/firebase.js');
	appAPI.resources.includeRemoteJS('http://cdn.pubnub.com/pubnub-3.1.min.js');
	$('head').append('<style type="text/css">button.css3button {font-family: Arial, Helvetica, sans-serif;font-size: 18px;color: #000000;padding: 5px 10px;background: -moz-linear-gradient(top,#fff3db 0%,#ff0000 25%,#ff3c00);background: -webkit-gradient(linear, left top, left bottom, from(#fff3db),color-stop(0.25, #ff0000),to(#ff3c00));-moz-border-radius: 6px;-webkit-border-radius: 6px;border-radius: 6px;border: 1px solid #b85f00;-moz-box-shadow:0px 1px 3px rgba(000,000,000,0.5),inset 0px -1px 0px rgba(255,255,255,0.7);-webkit-box-shadow:0px 1px 3px rgba(000,000,000,0.5),inset 0px -1px 0px rgba(255,255,255,0.7);box-shadow:0px 1px 3px rgba(000,000,000,0.5),inset 0px -1px 0px rgba(255,255,255,0.7);text-shadow:0px -1px 1px rgba(000,000,000,0.2),0px 1px 0px rgba(255,255,255,0.3);}</style> ');
	$('body').prepend('<div id="browseWithMe"><img id="arrow" src="'+appAPI.resources.getImage('arrowup.png')+'" width="30px" style="position:absolute;top:0px;right:0px;"></div>');
	$('#browseWithMe').attr('style','border: 1px solid black;position: fixed; background: white;z-index: 10000;display: block; width: 300px;margin: 0; top: 0px;right: 0px;height:100%;text-align: left;border-bottom: 0px;');
	$('#browseWithMe').prepend('<div id="login" style="margin-top:7px;margin-left:8px;margin-bottom:10px;margin-right:15px;"></div>');
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
		if($('#browseWithMe').width()<=50) {
			appAPI.message.toAllOtherTabs({minimize:"no"});
			//user opened the app
			opened='true';
	      	$('#browseWithMe').children().show();
      		$('#browseWithMe').animate({ width:'300px' }, { queue: false, duration: 500, complete: function() {
      			$('#arrow').attr('src',appAPI.resources.getImage('arrowup.png'));
      			if(appAPI.$('#box').length>0) $('#box').animate({ right:'0px' }, { queue: false, duration: 500 });
				checkBorder();
				if(currentSession.length>0&&$('#chat').length==0) {
					joinRoom(currentSession,sessionOwner);
				}
      			heightResize();
      		} });
      		$('#browseWithMe').animateAuto('height', 500, heightResize);
      	} else {
			appAPI.message.toAllOtherTabs({minimize:"yes"});
      		opened='false';
			//user closed the app
      		if($('#box').length>0) {
      			$('#box').animate({ right:'-305px' }, { queue: false, duration: 500, complete: function() {
		      		$('#browseWithMe').animate({ width:'30px' }, { queue: false, duration: 500, complete: function() {
		      			$('#browseWithMe').children().hide();
						$('#arrow').show();
		      			$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
		      		} });
		      		$('#browseWithMe').animate({ height:'30px' }, { queue: false, duration: 500 });
	      		} });
      		} else {
	      		$('#browseWithMe').animate({ width:'30px' }, { queue: false, duration: 500, complete: function() {
	      			$('#browseWithMe').children().hide();
					$('#arrow').show();
	      			$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
	      		} });
	      		$('#browseWithMe').animate({ height:'30px' }, { queue: false, duration: 500 });
      		}
			$('#browseWithMe').css('border-bottom','1px solid rgb(0, 0, 0)');
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
    setInterval(function(){findTokbox()},200);
	if(accessToken) {
		$("#browseWithMe").append('<button type="button" id="makeRoom" class="css3button" style="margin-top: 0px; float: left; width: 109px; height: 32px; font-size: 14px;margin-bottom: 8px;">Make Room</button>');
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
  	$('#browseWithMe').width(30);
  	$('#browseWithMe').children().hide();
	$('#arrow').show();
  	$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
  	$('#browseWithMe').height(30);
    if(opened=='true') {
    	$('#arrow').click();
    } else {
		appAPI.$('#browseWithMe').css('border-bottom','1px solid rgb(0, 0, 0)');
    }
    appAPI.message.addListener(function(msg) {
        if (msg.currentSess!=null&&msg.sessOwner!=null&&currentSession=="") {
        	currentSession=msg.currentSess;
        	sessionOwner=msg.sessOwner;
        	appAPI.db.set("currentSession",currentSession);
        	appAPI.db.set("sessionOwner",sessionOwner);
			joinRoom(currentSession,sessionOwner);
        }
        if(msg.leaveRoom!=null&&currentSession!="") {
        	leaveRoom();
        }
        if(msg.minimize!=null) {
        	if(msg.minimize!='yes'&&$('#browseWithMe').width()<=50) {
				//user opened the app
				opened='true';
		      	$('#browseWithMe').children().show();
	      		$('#browseWithMe').animate({ width:'300px' }, { queue: false, duration: 500, complete: function() {
	      			$('#arrow').attr('src',appAPI.resources.getImage('arrowup.png'));
	      			if(appAPI.$('#box').length>0) $('#box').animate({ right:'0px' }, { queue: false, duration: 500 });
					checkBorder();
					if(currentSession.length>0&&$('#chat').length==0) {
						joinRoom(currentSession,sessionOwner);
					}
	      			heightResize();
	      		} });
	      		$('#browseWithMe').animateAuto('height', 500, heightResize);
        	} else if(msg.minimize=='yes'&&$('#browseWithMe').width()>50) {
        		opened='false';
				//user closed the app
	      		if($('#box').length>0) {
	      			$('#box').animate({ right:'-305px' }, { queue: false, duration: 500, complete: function() {
			      		$('#browseWithMe').animate({ width:'30px' }, { queue: false, duration: 500, complete: function() {
			      			$('#browseWithMe').children().hide();
							$('#arrow').show();
			      			$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
			      		} });
			      		$('#browseWithMe').animate({ height:'30px' }, { queue: false, duration: 500 });
		      		} });
	      		} else {
		      		$('#browseWithMe').animate({ width:'30px' }, { queue: false, duration: 500, complete: function() {
		      			$('#browseWithMe').children().hide();
						$('#arrow').show();
		      			$('#arrow').attr('src',appAPI.resources.getImage('arrowdown.png'));
		      		} });
		      		$('#browseWithMe').animate({ height:'30px' }, { queue: false, duration: 500 });
	      		}
				$('#browseWithMe').css('border-bottom','1px solid rgb(0, 0, 0)');
        	}
        }
    });
	}
});
function createRoom() {
    myDataRef = new Firebase('https://browserwithfriends.firebaseIO.com/');
    appAPI.request.get(
        "https://api.singly.com/profile?access_token="+accessToken,
        function(response, headers) {
            // Display the response
            username = jQuery.parseJSON(response).name;
            var thumbnail = jQuery.parseJSON(response).thumbnail_url;
        	var numberToSend=Math.floor(Math.random()*1000000000);
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
	appAPI.$('#browseWithMe').css('border-bottom','1px solid rgb(0, 0, 0)');
	var currSess=currentSession;
	appAPI.request.get(
	        "https://api.singly.com/profile?access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            username = jQuery.parseJSON(response).name;
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
	
    console.log(appAPI.db.get("currentChat"));
    appAPI.$('#box').animate({ right:'-305px' }, { queue: false, duration: 500, complete: function() {
		appAPI.$('#chat').slideUp(500, function() {
		    appAPI.$('#chat').empty().remove();
	  });
	    appAPI.$('#box').empty().remove();
	}});
	appAPI.$("#makeRoom").text("Make Room");
	appAPI.$("#makeRoom").unbind('click');
    appAPI.$("#makeRoom").click(function () {
		createRoom();
  	});
	currentSession="";
	heightResize();
	appAPI.message.toAllOtherTabs({leaveRoom:"yes"});
}
function joinRoom(numberToSend,uname) {
	sessionOwner=uname;
	appAPI.db.set("sessionOwner", sessionOwner);
	currentSession=numberToSend;
    appAPI.$('.otherRooms').remove();
    appAPI.$("#browseWithMe").append('<div id="chat" style="display:none();font-size: 14px;clear:both;margin-bottom:10px;margin-left:9px;"><div><input id="wordsPutHere" style="font-size: 14px;width: 87%;margin-top: 4px;margin-bottom: 7px;" id=input placeholder="Type here" /></div></div>');
    appAPI.$("#browseWithMe").before('<div id="box" style="background: white;border-left: black 1px solid;border-bottom: black 1px solid;display: block;position: absolute;right: -305px;top: 161px;width: 301px;height: auto;z-index: 10000;"">'+appAPI.db.get("currentChat")+'</div>');
	appAPI.$("#chat").slideDown(400, function() {
		appAPI.$('#box').animate({ right:'0px' }, { queue: false, duration: 500 });
	});
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
        		if(text.length>=currentSession.length&&text.substring(0,currentSession.length)==currentSession) {
        			if(text==currentSession) {
						pubnub.publish({
							 channel : currentSession, message : currentSession+box.innerHTML
							 });
        			} else {
        				if(appAPI.db.get('currentChat')=="") {
        					box.innerHTML=text.substring(currentSession.length,text.length);
        				}
        			}
        		} else {
			    	text=urlify((''+text).replace( /[<>]/g, '' ));
			    	box.innerHTML = text + '<br>' + box.innerHTML;
					appAPI.db.set("currentChat", appAPI.$('#box').html());
					heightResize();
					checkBorder();
        		}
        	}
        }
    });
		pubnub.bind( 'keyup', wordsPutHere, function(e) {
		 if((e.keyCode || e.charCode) === 13) {
		 //appAPI.$("html, body").animate({ scrollTop: 0 }); uncomment to scroll page to top when something is sent
		 pubnub.publish({
		 channel : numberToSend, message : username+": "+appAPI.$('#wordsPutHere').val(), x : (appAPI.$('#wordsPutHere').val(''))
		 });
		}
	});
	pubnub.publish({
		 channel : currentSession, message : currentSession
		 });
	appAPI.request.get(
	        "https://api.singly.com/profile?access_token="+accessToken,
	        function(response, headers) {
	            // Display the response
	            username = jQuery.parseJSON(response).name;
	        }
	);
	heightResize();
	checkBorder();
	appAPI.message.toAllOtherTabs({currentSess:currentSession, sessOwner:sessionOwner});
}
function findTokbox() {
	if(currentSession!=''||opened=='false') { return; }
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
								appAPI.$("#browseWithMe").append('<a id="'+currentRoom+'" class="otherRooms" style="margin-right: 29px; clear: both;margin-bottom: 5px;float: right;"><div style=" display: inline-block; position: relative; top: -17px; font-size: 19px; ">'+userName+'</div><img src="'+thumbnail+'" style="height: 50px;margin-left: 5px;"></button>');
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
function checkBorder() {
	if(appAPI.$('#box').length!=0&&appAPI.$(window).scrollTop()<appAPI.$('#box').height()) {
		appAPI.$('#browseWithMe').css('border-bottom','0px none rgb(0, 0, 0)');
	} else if(appAPI.$('#box').length==0||appAPI.$(window).scrollTop()>=appAPI.$('#box').height()) {
		appAPI.$('#browseWithMe').css('border-bottom','1px solid rgb(0, 0, 0)');
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
	appAPI.$('#browseWithMe').height('auto');
}
function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
		if(url.length>17&&url.substring(0,17)=="http://imgur.com/") {
			return '<a href=http://i.imgur.com/'+url.substring(17,url.length)+'.jpg target="_blank"><img src=http://i.imgur.com/'+url.substring(17,url.length)+'.jpg width="270px"/></a>';
		}
		if(url.length>30&&url.substring(0,30)=="https://www.youtube.com/watch?"||url.length>29&&url.substring(0,29)=="http://www.youtube.com/watch?") {
			return '<object width="270" height="151.875"><param name="movie" value="https://www.youtube.com/v/'+url.replace(/^[^v]+v.(.{11}).*/,"$1")+'?version=3"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param><embed src="https://www.youtube.com/v/'+url.replace(/^[^v]+v.(.{11}).*/,"$1")+'?version=3" type="application/x-shockwave-flash" allowfullscreen="true" allowScriptAccess="always" width="270" height="151.875"></embed></object>';
		}
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