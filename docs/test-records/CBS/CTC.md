---
layout: default
title: CBS Technology Center
parent: Test Records
nav_order: 2
---

<div id="adobe-dc-view" style="height: 80vh;">
	<script src="https://acrobatservices.adobe.com/view-sdk/viewer.js"></script>
	<script type="text/javascript">
		document.addEventListener("adobe_dc_view_sdk.ready", function(){ 
			var adobeDCView = new AdobeDC.View({clientId: "5aca0821dfc443928ce227808de9010e", divId: "adobe-dc-view"});
			adobeDCView.previewFile({
				content:{location: {url: "/assets/pdf/CBS Pro Series Test Records.pdf"}},
				metaData:{fileName: "CBS Pro Series Test Records.pdf"}
			}, {defaultViewMode: "FIT_WIDTH", showAnnotationTools: false});
		});
	</script>
	<br class="clear"/>
</div>
