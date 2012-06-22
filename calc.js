/**
 *  Zetamari
 *
 *  Copyright (c) 2004,2010  Peter Heinrich
 *  All Rights Reserved
 */

/**
 *  Make sure this page isn't trapped in someone else's frame.
 */
if( top != self )
   top.location.replace( location.href );

var units = new Array( "mm", 0.0393700787,
                       "cm", 0.393700787,
                       "m",  39.3700787,
                       "in", 1.0,
                       "ft", 12.0,
                       "yd", 36.0 );

function getObject( id )
{
   var object = null;

   if( document.getElementById )
      object = document.getElementById( id );
   else if( document.all )
      object = document.all[ id ];
   else if( document.layers )
      object = document.layers[ id ];

   return( object );
}

function getStyle( object )
{
   return( object.style ? object.style : object );
}

function estimateGlass( area, width, height )
{
   //  Account for 5/16" rabbet on all four edges.
   width += 0.625;
   height += 0.625;

   //  Minimum charge is 1 sq. ft.
   var cost = (144 > area ? 144 : area) * 3.0 / 144;
   var x = Math.min( width, height );
   var y = Math.max( width, height );

   if( 24 >= x )
   {
      if( 48 < y )
         cost += 100;   //  custom cut
      else
         cost += 0;     //  fits on our standard 24" x 48" sheet
   }
   else if( 30 >= x )
   {
      if( 36 >= y )
         cost += 30;    //  fits on Home Depot's largest bath mirror
      else
         cost += 100;   //  custom cut
   }
   else
      cost += 100;      //  custom cut

   return( cost );
}

function enableModel( name, field, area, glass, queryString )
{
   var object = getObject( field );
   
   getStyle( object ).visibility = "visible";
   object.onclick = function() { showModel( name, area, glass, queryString ); }
}

function disableModel( field )
{
   getStyle( getObject( field ) ).visibility = "hidden";
}

function showModel( name, area, glass, queryString )
{
   var cw = getObject( 'canvas_width' ).value;
   var ch = getObject( 'canvas_height' ).value;
   var sk = getObject( 'show_key' ).checked;

   if( 0 >= cw )
      cw = 450;
   if( 0 >= ch )
      ch = 450;

   var st = getObject( 'show_title' ).checked;
   var sp = getObject( 'show_price' ).checked;

   var title = "";
   if( st )
      title = name;
   if( sp )
   {
      var ppf = getObject( "price_per_foot" ).value;

      if( 0 >= ppf )
         ppf = 325.0;
      if( st )
         title += ": ";

      var cost = area * ppf / 144;
      var eg = getObject( "estimate_glass" ).checked;

      title += "$" + cost.toFixed( 2 );
      if( eg )
      {
         cost += glass;
         title += " ($" + cost.toFixed( 2 ) + " w/glass)";
      }
   }

   openWindow( "shapevis.php?" + queryString + "&cw=" + cw + "&ch=" + ch + "&sk=" + (sk ? 1 : 0) + (st ? "&t=" + escape( title ) : "") );
/*   alert( "shapevis.php?" + queryString + "&cw=" + cw + "&ch=" + ch + "&sk=" + (sk ? 1 : 0) + (st ? "&t=" + escape( title ) : "") );
*/
}

function openWindow( url )
{
   var cw = getObject( 'canvas_width' ).value - -25;
   var ch = getObject( 'canvas_height' ).value - -40;

   newwindow = window.open( url, 'shape', 'height=' + ch + ',width=' + cw + ',directories=no,location=no,menubar=no,resizable=no,scrollbars=no,status=no,toolbar=no' );

   if( window.focus )
      newwindow.focus();
}

/**
 *  Retrieves a numeric value from a named input box, possibly converting it to
 *  the equivalent measurement in inches.  It uses the 'units' array (defined
 *  above) to look up scalar conversion factors for various units.
 */
function getInches( field )
{
   var value = getObject( field ).value.replace( /([0-9.]*)\s*(\S*)/, "$1 $2" ).split( " " );
   var inches = value[ 0 ];

   //  If no units specified, use inches.
   if( 0 == value[ 1 ].length )
      value[ 1 ] = "in";

   //  Format with measurement unit.
   if( 0 < value[ 0 ].length )
      getObject( field ).value = value[ 0 ] + " " + value[ 1 ];

   //  Find the scalar conversion (to inches) for the units specified.
   for( i = 0; i < units.length; i += 2 )
   {
      if( units[ i ] == value[ 1 ] )
      {
          inches *= units[ 1 + i ];
          break;
      } 
   }

   return( inches );
}

/**
 *  Rounds the specified value to two digits to the right of the decimal point.
 *  This function also performs a simple conversion to square feet.
 */
function showResult( area )
{
  return( (area / 144).toFixed( 2 ) + " ft<sup>2</sup><br/>(" + area.toFixed( 2 ) + " in<sup>2</sup>)" );
}

/**
 *  Updates an input box with the value specified, rounded to two digits to the
 *  right of the decimal point.  This function also adds the default unit of
 *  measurement (in).
 */
function updateField( field, value )
{
  getObject( field ).value = Math.round( 100 * value ) / 100 + " in";
}

function updatePrice()
{
  var disabled = !getObject( "show_price" ).checked;

  getObject( "price_per_foot" ).disabled = disabled;
  getObject( "estimate_glass" ).disabled = disabled;
}

/**
 *  Computes the area of a ring (two concentric circles).  They may be defined
 *  by an inner and outer diameter, or a single diameter and a border size.
 */
function docircle()
{
   var od = getInches( 'circle_od' );
   var id = getInches( 'circle_id' );
   var border = getInches( 'circle_border' );

   var error = null;

   if( 0 < od && 0 < id )
   {
      if( od <= id )
         error = "The outside diameter must be larger than the inside diameter";
      else
         updateField( 'circle_border', (od - id) / 2 );
   }
   else if( 0 < od && 0 < border )
   {
      if( od / 2 <= border )
         error = "The border is too large to produce a valid shape";
      else
      {
         id = od - 2*border;
         updateField( 'circle_id', id );
      }
   }
   else if( 0 < id && 0 < border )
   {
      od = id - -2*border;
      updateField( 'circle_od', od );
   }
   else
      error = "Please enter at least two positive values";

   var result = getObject( 'circle_result' );
   if( null == error )
   {
      var area = Math.PI * ((od / 2) * (od / 2));
      var glass = Math.PI * ((id / 2) * (id / 2));

      area -= glass;
      glass = estimateGlass( glass, id, id );

      result.innerHTML = showResult( area );
      enableModel( 'Circle', 'circle_view', area, glass, 's=3&w=' + od + '&iw=' + id );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'circle_view' );
   }
}

function docathedral()
{
   var width  = getInches( 'cathedral_width' );
   var height = getInches( 'cathedral_height' );
   var border = getInches( 'cathedral_border' );

   var error = null;

   if( 0 < width && 0 < height && 0 < border )
   {
      if( width / 2 <= border || height / 2 <= border )
         error = "The border is too large to produce a valid shape";
      else if( height <= (width / 2 - -border) )
         error = "The shape requested is too short to be valid";
   }
   else
      error = "Please enter width, height, and border";

   result = getObject( 'cathedral_result' );
   if( null == error )
   {
      var w = width - 2*border;
      var h = height - 2*border;

      var area = (width * width) * (height / width + Math.PI / 8 - 0.5);
      var glass = ((w * w) * (h / w + Math.PI / 8 - 0.5));

      area -= glass;
      glass = estimateGlass( glass, w, h );

      result.innerHTML = showResult( area );
      enableModel( 'Cathedral', 'cathedral_view', area, glass, 's=1&w=' + width + '&h=' + height + "&b=" + border );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'cathedral_view' );
   }
}

function docathedral2()
{
   var width  = getInches( 'cathedral2_width' );
   var height = getInches( 'cathedral2_height' );
   var border = getInches( 'cathedral2_border' );
   var base   = getInches( 'cathedral2_base' );

   var error = null;

   if( 0 < width && 0 < height && 0 < border && 0 < base )
   {
      if( width / 2 <= border || height <= base + border )
         error = "The border and/or base are too large to produce a valid shape";
      else if( height <= (width / 2 - -base) )
         error = "The shape requested is too short to be valid";
   }
   else
      error = "Please enter width, height, border, and base";

   result = getObject( 'cathedral2_result' );
   if( null == error )
   {
      var w = width - 2*border;
      var h = height - border - base;

      var area = (width * width) * (height / width + Math.PI / 8 - 0.5);
      var glass = (w * w) * (h / w + Math.PI / 8 - 0.5);

      area -= glass;
      glass = estimateGlass( glass, w, h );

      result.innerHTML = showResult( area );
      enableModel( 'Cathedral', 'cathedral2_view', area, glass, 's=2&w=' + width + '&h=' + height + "&b=" + border + "&a=" + base );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'cathedral2_view' );
   }
}

function doellipse()
{
   var ow = getInches( 'ellipse_ow' );
   var oh = getInches( 'ellipse_oh' );
   var iw = getInches( 'ellipse_iw' );
   var ih = getInches( 'ellipse_ih' );
   var border = getInches( 'ellipse_border' );

   var error = null;

   if( 0 < ow && 0 < oh && 0 < iw && 0 < ih )
   {
      if( ow <= iw )
         error = "The outside width must be larger than the inside width";
      else if( oh <= ih )
         error = "The outside height must be larger than the inside height";
      else if( ow - iw == oh - ih )
      {
         //  Update the border parameter if it's uniform.
         updateField( 'ellipse_border', (ow - iw) / 2 );
      }
   }
   else if( 0 < ow && 0 < oh && 0 < border )
   {
      if( ow / 2 <= border || oh / 2 <= border )
         error = "The border is too large to produce a valid shape";
      else
      {
         iw = ow - 2*border;
         updateField( 'ellipse_iw', iw );

         ih = oh - 2*border;
         updateField( 'ellipse_ih', ih );
      }
   }
   else if( 0 < iw && 0 < ih && 0 < border )
   {
      ow = iw - -2*border;
      updateField( 'ellipse_ow', ow );

      oh = ih - -2*border;
      updateField( 'ellipse_oh', oh );
   }
   else
      error = "Please enter (OW OH b), (iw ih b), or (OW OH iw ih)";

   var result = getObject( 'ellipse_result' );
   if( null == error )
   {
      var area = Math.PI * (ow * oh) / 4;
      var glass = Math.PI * (iw * ih) / 4;

      area -= glass;
      glass = estimateGlass( glass, iw, ih );

      result.innerHTML = showResult( area );
      enableModel( 'Oval', 'ellipse_view', area, glass, 's=4&w=' + ow + '&h=' + oh + "&iw=" + iw + "&ih=" + ih );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'ellipse_view' );
   }
}

function dorectangle()
{
   width  = getInches( 'rectangle_width' );
   height = getInches( 'rectangle_height' );
   border = getInches( 'rectangle_border' );

   var error = null;

   if( 0 < width && 0 < height && 0 < border )
   {
      if( width / 2 <= border || height / 2 <= border )
         error = "The border is too large to produce a valid shape";
   }
   else
      error = "Please enter width, height, and border";

   result = getObject( 'rectangle_result' );
   if( null == error )
   {
      var area = width * height;
      var glass = (width - 2*border) * (height - 2*border);

      area -= glass;
      glass = estimateGlass( glass, width - 2*border, height - 2*border );

      result.innerHTML = showResult( area );
      enableModel( 'Rectangle', 'rectangle_view', area, glass, 's=5&w=' + width + '&h=' + height + "&b=" + border );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'rectangle_view' );
   }
}

function dosquare()
{
   var width  = getInches( 'square_width' );
   var border = getInches( 'square_border' );

   var error = null;

   if( 0 < width && 0 < border )
   {
      if( width / 2 <= border )
         error = "The border is too large to produce a valid shape";
   }
   else
      error = "Please enter both width and border";

   result = getObject( 'square_result' );
   if( null == error )
   {
      var area = width * width;
      var glass = (width - 2*border) * (width - 2*border);

      area -= glass;
      glass = estimateGlass( glass, width - 2*border, width - 2*border );

      result.innerHTML = showResult( area );
      enableModel( 'Square', 'square_view', area, glass, 's=6&w=' + width + '&b=' + border );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'square_view' );
   }
}

function dovesica()
{
   var width  = getInches( 'vesica_width' );
   var height = getInches( 'vesica_height' );
   var border = getInches( 'vesica_border' );

   var error  = null;

   if( 0 < width && 0 < border )
   {
      height = width * Math.sqrt( 3 );
      updateField( 'vesica_height', height );
   }
   else if( 0 < height && 0 < border )
   {
      width = height / Math.sqrt( 3 );
      updateField( 'vesica_width', width );
   }
   else
      error = "Please enter a border size plus either a width or height";

   if( null == error && width / 2 <= border )
      error = "The border is too large to produce a valid shape";

   var result = getObject( 'vesica_result' );
   if( null == error )
   {
      var constant = (4 * Math.PI - 3 * Math.sqrt( 3 )) / 6;
      var w = width - 2*border;

      var area = (width * width) * constant;
      var glass = (w * w) * constant;

      area -= glass;
      glass = estimateGlass( glass, w, constant );

      result.innerHTML = showResult( area );
      enableModel( 'Vesica Pisces', 'vesica_view', area, glass, 's=7&w=' + width + '&b=' + border );
   }
   else
   {
      result.innerHTML = error;
      disableModel( 'vesica_view' );
   }
}
