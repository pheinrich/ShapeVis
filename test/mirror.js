function ShapeVis( panel )
{
    this.canvas = panel.find( "canvas" )[0];
    this.context = this.canvas.getContext( "2d" );

    this.zoom = 1;
    this.isAspectLocked = false;
    this.origin = { x: this.canvas.width / 2, y: this.canvas.height / 2 };

    this.inLine = new EllipseOutline( 1000, 2250 );
    this.outLine = new EllipseOutline( 1500, 2750 );
    this.handle = null;
    this.selected = null;

    this.controls = {
	lockAspect:  panel.find( "div.view input:checkbox" )[0],
	zoomSlider:  panel.find( "div.zoom input" )[0],
	zoomValue:   panel.find( "div.zoom span" )[0],
        resetBorder: panel.find( "div.dimensions input[type='button']" )[0],

        inWidth:   panel.find( "div.dimensions input.iwidth" )[0],
        inHeight:  panel.find( "div.dimensions input.iheight" )[0],
        outWidth:  panel.find( "div.dimensions input.width" )[0],
        outHeight: panel.find( "div.dimensions input.height" )[0],
        border:    panel.find( "div.dimensions input.border" )[0],

        cost: panel.find( "span.cost" )[0],
	area: panel.find( "span.area" )[0]
    };

    var that = this;

    $(this.controls.lockAspect).click(  function() { ShapeVis.doLockAspect( that ) } );
    $(this.controls.zoomSlider).change( function() { ShapeVis.doZoomSlider( that ) } );
    $(this.controls.resetBorder).click( function() { ShapeVis.doResetBorder( that ) } );

    this.canvas.addEventListener( "mousemove", function() { ShapeVis.mouseMove( that ) }, false );
    this.canvas.addEventListener( "mousedown", function() { ShapeVis.mouseDown( that ) }, false );
    this.canvas.addEventListener( "mouseup",   function() { ShapeVis.mouseUp( that ) },   false );

    ShapeVis.doZoomSlider( that );
}

ShapeVis.tabTemplate = function( href, label )
{
    return( "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>" );
}

ShapeVis.prototype.getPosition = function( event )
{
    var target;

    if( !event )
	event = window.event;

    if( event.target )
	target = event.target;
    else if( event.srcElement )
	target = event.srcElement;

    // Defeat Safari bug.
    if( 3 == target.nodeType )
	target = target.parentNode;

    var x = event.pageX - $(target).offset().left;
    var y = event.pageY - $(target).offset().top;

    return {
	x: (x - this.origin.x) / this.zoom,
	y: (y - this.origin.y) / this.zoom
    };
}

ShapeVis.doLockAspect = function( that )
{
    that.isAspectLocked = $(that.controls.lockAspect).is( ":checked" );
}

ShapeVis.doZoomSlider = function( that )
{
    var value = $(that.controls.zoomSlider).val();

    $(that.controls.zoomValue).html( value );
    that.zoom = Math.pow( 1.5, value - 10 );
    that.redraw();
}

ShapeVis.doResetBorder = function( that )
{
    var inside = that.inLine.getExtent();
    var outside = that.outLine.getExtent();
    var border = Math.min( outside.width - inside.width, outside.height - inside.height );

    inside.width = outside.width - border;
    inside.height = outside.height - border;
    inside.left = -inside.width / 2;
    inside.top = -inside.height / 2;

    that.inLine.setExtent( inside );
    that.redraw();
}

ShapeVis.prototype.draw = function()
{
    var area = this.outLine.getArea();
    var extent = this.outLine.getExtent();

    $(this.controls.outWidth).val( (Math.round( extent.width ) / 100) + " in" );
    $(this.controls.outHeight).val( (Math.round( extent.height ) / 100) + " in" );

    this.context.save();
    this.context.transform( this.zoom, 0, 0, this.zoom, this.origin.x, this.origin.y );
    this.outLine.trace( this.context );
    this.context.restore();

    this.context.fillStyle = "#eda";
    this.context.strokeStyle = "#000";
    this.context.lineWidth = 3;
    this.context.fill();
    this.context.stroke();

    this.context.save();
    this.context.transform( this.zoom, 0, 0, this.zoom, this.origin.x, this.origin.y );
    this.inLine.trace( this.context );
    this.context.restore();

    area -= this.inLine.getArea();
    $(this.controls.area).html( (Math.round( area / 14400 ) / 100) + " ft<sup>2</sup> (" +
                             (Math.round( area / 100 ) / 100) + " in<sup>2</sup>)" );
    $(this.controls.cost).html( "$" + (Math.round( 325 * area / 14400 ) / 100) );

    extent = this.inLine.getExtent();
    $(this.controls.inWidth).val( (Math.round( extent.width ) / 100) + " in" );
    $(this.controls.inHeight).val( (Math.round( extent.height ) / 100) + " in" );

    var gradient = this.context.createLinearGradient( 0, 0, this.canvas.width, this.canvas.height );
    gradient.addColorStop( 0, "#aaa" );
    gradient.addColorStop( 1, "#fff" );

    this.context.fillStyle = gradient;
    this.context.lineWidth = 2;
    this.context.fill();
    this.context.stroke();
}

ShapeVis.prototype.redraw = function()
{
    this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
    this.draw();
}

ShapeVis.mouseMove = function( that )
{
    if( that.handle )
    {
	var point = that.getPosition();
	var dirty = false;

	that.handle.delta = { x: point.x - that.handle.x, y: point.y - that.handle.y };

	if( that.selected == that.outLine )
	    dirty = that.outLine.resize( that.handle, null, that.isAspectLocked );

	if( dirty || that.selected == that.inLine )
	    dirty |= that.inLine.resize( that.handle, null, that.isAspectLocked );

	if( dirty )
        {
	    that.handle.x = point.x; that.handle.y = point.y;
	    that.redraw();
	}
    }
}

ShapeVis.mouseDown = function( that )
{
    that.handle = that.outLine.getHandle( that.getPosition(), Outline.handleSize / that.zoom );
    if( that.handle )
	that.selected = that.outLine;
    else
    {
	that.handle = that.inLine.getHandle( that.getPosition(), Outline.handleSize / that.zoom );
	if( that.handle )
	    that.selected = that.inLine;
    }
}

ShapeVis.mouseUp = function( that )
{
    that.handle = null;
    that.selected = null;
}
