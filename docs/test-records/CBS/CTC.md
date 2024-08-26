---
title: CBS Technology Center (CTC) 1
parent: Test Records
nav_order: 2
---


<object data="CBS Pro Series Test Records.pdf" width="1000" height="1000" type='application/pdf'>
  <p>Your broswer cannot display this PDF.  Please download it here.</p>
</object>


<html>
 4<head>
 5 <title>Adobe Document Services PDF Embed API Sample</title>
 6 <meta charset="utf-8"/>
 7 <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
 8 <meta id="viewport" name="viewport" content="width=device-width, initial-scale=1"/>
 9</head>
10<body style="margin: 0px">
11 <div id="adobe-dc-view"></div>
12 <script src="https://documentcloud.adobe.com/view-sdk/main.js"></script>
13 <script type="text/javascript">
14    document.addEventListener("adobe_dc_view_sdk.ready", function()
15    {
16        var adobeDCView = new AdobeDC.View({clientId: "5aca0821dfc443928ce227808de9010e", divId: "adobe-dc-view"});
17        adobeDCView.previewFile(
18       {
19          content:   {location: {url: "https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf"}},
20          metaData: {fileName: "Bodea Brochure.pdf"}
21       });
22    });
23 </script>
24</body>
25</html>
