---
title: CBS Technology Center
parent: Test Records
nav_order: 2
---

<div id="adobe-dc-view" style="width: 800px;"></div>
<script src="https://acrobatservices.adobe.com/view-sdk/viewer.js"></script>
<script type="text/javascript">
	document.addEventListener("adobe_dc_view_sdk.ready", function(){ 
		var adobeDCView = new AdobeDC.View({clientId: "<YOUR_CLIENT_ID>", divId: "adobe-dc-view"});
		adobeDCView.previewFile({
			content:{location: {url: "../assets/pdf/CBS Pro Series Test Records.pdf"}},
			metaData:{fileName: "CBS Pro Series Test Records.pdf"}
		}, {embedMode: "IN_LINE"});
	});
</script>
