/************************************************************************************
  This is your background code.
  For more information please visit our wiki site:
  http://docs.crossrider.com/#!/guide/background_scope
*************************************************************************************/

function getSession()
{
	var xmlhttp;
	xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function()
	{
	  	if (xmlhttp.readyState==4 && xmlhttp.status==200)
	  	{ 	
  			var ans=xmlhttp.responseXML.getElementsByTagName("session_id")[0].childNodes[0].nodeValue;;
	  		appAPI.db.set("session",ans);
	  	}
	}
	xmlhttp.open("POST","https://api.opentok.com/hl/session/create",true);
	xmlhttp.setRequestHeader("X-TB-PARTNER-AUTH", "11640702:599049e15f15f93bf46c991afe2553404a606d7d");
	xmlhttp.send();
}
getSession();