---
title: CBS Technology Center
parent: Test Records
nav_order: 2
---


<object data="CBS Pro Series Test Records.pdf" width="1000" height="1000" type='application/pdf'>
  <p>Your broswer cannot display this PDF.  Please download it here.</p>
</object>


<html>
<head>
<title>Adobe Document Services PDF Embed API Sample</title>
  <meta charset="utf-8"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
  <meta id="viewport" name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin: 0px">
  <div id="adobe-dc-view"></div>
  <script src="https://documentcloud.adobe.com/view-sdk/main.js"></script>
  <script type="text/javascript">
    document.addEventListener("adobe_dc_view_sdk.ready", function()
    {
      var adobeDCView = new AdobeDC.View({clientId: "5aca0821dfc443928ce227808de9010e", divId: "adobe-dc-view"});
      adobeDCView.previewFile(
      {
        content:   {location: {url: "https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf"}},
        metaData: {fileName: "Bodea Brochure.pdf"}
      });
    });
  </script>
</body>
</html>
