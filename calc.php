<?
include("session.php");
$SectionPath = "<a href='index2.php'><b>home</b> </a> - area calculators";
$Section = "Area Calculators";
include("databaseinfo.php");
include('variables.php');
$helpTopic = "Menu.php";
?>
<html>
<head>
<title><? echo $Section ?></title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<link href="styles/Template1.php" rel="stylesheet" type="text/css" />
<link href="styles/calc.css" rel="stylesheet" type="text/css"/>
<script type="text/javascript" src="calc.js"/>
</head>

<? 
include('header.php'); 

if (!isset($_GET['cw']))  $_GET['cw'] = 450;
if (!isset($_GET['ch']))  $_GET['ch'] = 450;
if (!isset($_GET['p']))   $_GET['p']  = 325;
?>


<table width="700">
<tr><td><br></td></tr>
<tr>
<td class="bigHeader">
area calculators:<br>
</td>
</tr>
</table>

<? if ($reorder_msg != "" || $reorder_msg != null) { ?>
<table width="700">
<tr>
	<td class="message"><? echo $reorder_msg ?><br></td>
</tr>
</table>
<? } ?>

  <form action="" class="canvas">
    <div>
      <p>Change the values below to modify the size of the shape preview window.</p>
      <p>Close the previous window (if already open) and re-click <strong>View</strong> to see your changes.</p>

      <table>
        <tr>
          <td><label for="canvas_width">View Width:</label></td>
          <td><input id="canvas_width" size="8" type="text" value="<? echo $_GET['cw'] ?>"/></td>
        </tr>
        <tr>
          <td><label for="canvas_height">View Height:</label></td>
          <td><input id="canvas_height" size="8" type="text" value="<? echo $_GET['ch'] ?>"/></td>
        </tr>
        <tr>
          <td colspan="2">
            <input id="show_title" type="checkbox" <? if (isset($_GET['st'])) { ?>checked="checked"<? } ?>/>
            <label for="show_title">Show Title</label>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <input id="show_key" type="checkbox" <? if (isset($_GET['sk'])) { ?>checked="checked"<? } ?>/>
            <label for="show_key">Show Key</label>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <input id="show_price" type="checkbox" <? if (isset($_GET['sp'])) { ?>checked="checked"<? } ?> onClick="updatePrice();"/>
            <label for="show_price">Show Price</label>
          </td>
        </tr>
        <tr>
          <td>&#160;&#160;&#160;&#160;based on:</td>
          <td>
            $<input id="price_per_foot" size="8" type="text" value="<? echo $_GET['p'] ?>" <? if(!isset($_GET['sp'])) { ?>disabled="disabled"<? } ?>/>
            / ft<sup>2</sup>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            &#160;&#160;&#160;
            <input id="estimate_glass" type="checkbox"
              <?php if (isset($_GET['eg'])) { ?>checked="checked"<? } ?>
              <?php if (!isset($_GET['sp'])) { ?>disabled="disabled"<? } ?>/>
            <label for="estimate_glass">Estimate Glass</label>
          </td>
        </tr>
      </table>
    </div>
  </form>

  <p>These calculators compute the surface area of various standard mirror shapes.  The results are returned in square inches and square feet, but the input values may be specified using several unit types, including millimeters (<strong>mm</strong>), centimeters (<strong>cm</strong>), meters (<strong>m</strong>), inches (<strong>in</strong>), feet (<strong>ft</strong>), and yards (<strong>yd</strong>).</p>

  <p>To supply a unit of measurement for any parameter, simply add its standard abbreviation after the numeric value.  For example, use <strong>17 mm</strong> to represent a measurement of 17 millimeters.  <em>If no unit is provided, inches are assumed.</em></p>

  <p>Enter some values and click <strong>Calculate</strong> to validate them and compute surface area.  If no problems were encountered, you'll also be presented with a new button, <strong>View</strong>, which will display a scale drawing of the corresponding shape.</p>

  <p>Don't forget to click <strong>Calculate</strong> again each time you change the dimensions, especially if you're using <strong>View</strong> to visualize the result.  Double-click a dimension <em>name</em> to reset just that value, or click <strong>Clear</strong> to start over with all new values.</p>

  <h2 class="bigheader">Circle</h2>
  <div class="calculator">
    <div class="description"><p>Enter any two of the three values below.</p></div>
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="114" width="96" src="images/circle.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="circle_od"/>
              <label for="circle_od" onDblClick="getObject('circle_od').value='';">OD = Outside Diameter</label><br/>
              <input size="8" type="text" id="circle_id"/>
              <label for="circle_id" onDblClick="getObject('circle_id').value='';">ID = Inside Diameter</label><br/>
              <input size="8" type="text" id="circle_border"/>
              <label for="circle_border" onDblClick="getObject('circle_border').value='';">b = border</label><br/>

              <input type="button" value="Calculate" onClick="docircle();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="circle_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="circle_result"/></td>
      </tr>
    </table>
  </div>

  <h2 class="bigheader">square</h2>
  <div class="calculator">
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="99" width="94" src="images/square.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="square_width"/>
              <label for="square_width" onDblClick="getObject('square_width').value='';">W = Width</label><br/>
              <input size="8" type="text" id="square_border"/>
              <label for="square_border" onDblClick="getObject('square_border').value='';">b = border</label><br/>

              <input type="button" value="Calculate" onClick="dosquare();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="square_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="square_result"/></td>
      </tr>
    </table>
  </div>

  <h2 class="bigheader">Rectangle</h2>
  <div class="calculator">
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="122" width="94" src="images/rectangle.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="rectangle_width"/>
              <label for="rectangle_width" onDblClick="getObject('rectangle_width').value='';">W = Width</label><br/>
              <input size="8" type="text" id="rectangle_height"/>
              <label for="rectangle_height" onDblClick="getObject('rectangle_height').value='';">H = Height</label><br/>
              <input size="8" type="text" id="rectangle_border"/>
              <label for="rectangle_border" onDblClick="getObject('rectangle_border').value='';">b = border</label><br/>

              <input type="button" value="Calculate" onClick="dorectangle();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="rectangle_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="rectangle_result"/></td>
      </tr>
    </table>
  </div>

  <h2 class="bigheader">Ellipse</h2>
  <div class="calculator">
    <div class="description">
      <p>Enter outside width/height + border, inside width/height + border, or outside width/height + inside width/height.  The last option allows for a non-uniform border.</p>
    </div>
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="136" width="121" src="images/ellipse.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="ellipse_ow"/>
              <label for="ellipse_ow" onDblClick="getObject('ellipse_ow').value='';">OW = Outside Width</label><br/>
              <input size="8" type="text" id="ellipse_oh"/>
              <label for="ellipse_oh" onDblClick="getObject('ellipse_oh').value='';">OH = Outside Height</label><br/>
              <input size="8" type="text" id="ellipse_iw"/>
              <label for="ellipse_iw" onDblClick="getObject('ellipse_iw').value='';">iw = Inside Width</label><br/>
              <input size="8" type="text" id="ellipse_ih"/>
              <label for="ellipse_ih" onDblClick="getObject('ellipse_ih').value='';">ih = Inside Height</label><br/>
              <input size="8" type="text" id="ellipse_border"/>
              <label for="ellipse_border" onDblClick="getObject('ellipse_border').value='';">b = border</label><br/>

              <input type="button" value="Calculate" onClick="doellipse();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="ellipse_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="ellipse_result"/></td>
      </tr>
    </table>
  </div>

  <h2 class="bigheader">Cathedral</h2>
  <div class="calculator">
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="133" width="107" src="images/cathedral.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="cathedral_width"/>
              <label for="cathedral_width" onDblClick="getObject('cathedral_width').value='';">W = Width</label><br/>
              <input size="8" type="text" id="cathedral_height"/>
              <label for="cathedral_height" onDblClick="getObject('cathedral_height').value='';">H = Height</label><br/>
              <input size="8" type="text" id="cathedral_border"/>
              <label for="cathedral_border" onDblClick="getObject('cathedral_border').value='';">b = border</label><br/>

              <input type="button" value="Calculate" onClick="docathedral();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="cathedral_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="cathedral_result"/></td>
      </tr>
    </table>
  </div>

  <h2 class="bigheader">Cathedral with Extended Base</h2>
  <div class="calculator">
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="146" width="120" src="images/cathedral2.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="cathedral2_width"/>
              <label for="cathedral2_width" onDblClick="getObject('cathedral2_width').value='';">W = Width</label><br/>
              <input size="8" type="text" id="cathedral2_height"/>
              <label for="cathedral2_height" onDblClick="getObject('cathedral2_height').value='';">H = Height</label><br/>
              <input size="8" type="text" id="cathedral2_border"/>
              <label for="cathedral2_border" onDblClick="getObject('cathedral2_border').value='';">b = border</label><br/>
              <input size="8" type="text" id="cathedral2_base"/>
              <label for="cathedral2_base" onDblClick="getObject('cathedral2_base').value='';">a = base</label><br/>

              <input type="button" value="Calculate" onClick="docathedral2();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="cathedral2_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="cathedral2_result"/></td>
      </tr>
    </table>
  </div>

  <h2 class="bigheader">Vesica Pisces</h2>
  <div class="calculator">
    <table class="form">
      <tr>
        <td style="width: 25%;"><img alt="Key" height="119" width="90" src="images/vesica.gif"/></td>
        <td style="width: 40%;">
          <form action="">
            <div>
              <input size="8" type="text" id="vesica_width"/>
              <label for="vesica_width" onDblClick="getObject('vesica_width').value='';">W = Width</label><br/>
              <input size="8" type="text" id="vesica_height"/>
              <label for="vesica_height" onDblClick="getObject('vesica_height').value='';">H = Height</label><br/>
              <input size="8" type="text" id="vesica_border"/>
              <label for="vesica_border" onDblClick="getObject('vesica_border').value='';">b = border</label><br/>

              <input type="button" value="Calculate" onClick="dovesica();"/>
              <input type="reset" value="Clear"/>
              <input style="visibility: hidden;" type="button" value="View" id="vesica_view"/>
            </div>
          </form>
        </td>
        <td style="width: 35%;"><div class="result" id="vesica_result"/></td>
      </tr>
    </table>
  </div>

<? 
include('footer.php');
?>
