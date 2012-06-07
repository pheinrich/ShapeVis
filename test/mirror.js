function ShapeVis( ui )
{
    var panel = $(ui.panel);

    this.tab = $(ui.tab);
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
        title:       panel.find( "div.controls input.title" )[0],
        select:      panel.find( "div.controls select" )[0],
        inWidth:     panel.find( "div.dimensions input.iwidth" )[0],
        inHeight:    panel.find( "div.dimensions input.iheight" )[0],
        outWidth:    panel.find( "div.dimensions input.width" )[0],
        outHeight:   panel.find( "div.dimensions input.height" )[0],
        border:      panel.find( "div.dimensions input.border" )[0],
        resetBorder: panel.find( "div.dimensions input[type='button']" )[0]
    };

    this.cost = {
        total: panel.find( "div.cost span.total" )[0],
	area: panel.find( "div.cost span.area" )[0]
    };

    var that = this;

    $(this.controls.title).val( this.tab.text() );
    $(this.controls.title).change( function() { that.tab.text( $(that.controls.title).val() ) } );
    $(this.controls.select).val( "ellipse" );

    panel.find( "div.dimensions" ).change( function( event ) { that.doDimensions.call( that, event ) } );
    $(this.controls.lockAspect).click( function( event ) { that.doLockAspect.call( that, event ) } );
    $(this.controls.zoomSlider).change( function( event ) { that.doZoomSlider.call( that, event ) } );
    $(this.controls.resetBorder).click( function( event ) { that.doResetBorder.call( that, event ) } );
    $(this.controls.select).change( function( event ) { that.doSelectShape.call( that, event ) } );

    this.canvas.addEventListener( "mousemove", function( event ) { that.mouseMove.call( that, event ) }, false );
    this.canvas.addEventListener( "mousedown", function( event ) { that.mouseDown.call( that, event ) }, false );
    this.canvas.addEventListener( "mouseup",   function( event ) { that.mouseUp.call( that, event ) },   false );

    this.doZoomSlider();
    this.doSelectShape();
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

ShapeVis.prototype.doDimensions = function( event )
{
}

ShapeVis.prototype.doLockAspect = function( event )
{
    this.isAspectLocked = $(this.controls.lockAspect).is( ":checked" );
}

ShapeVis.prototype.doZoomSlider = function( event )
{
    var value = $(this.controls.zoomSlider).val();

    $(this.controls.zoomValue).html( value );
    this.zoom = Math.pow( 1.5, value - 10 );
    this.redraw();
}

ShapeVis.prototype.doResetBorder = function( event )
{
    var inside = this.inLine.getExtent();
    var outside = this.outLine.getExtent();
    var border = Math.min( outside.width - inside.width, outside.height - inside.height );

    inside.width = outside.width - border;
    inside.height = outside.height - border;
    inside.left = -inside.width / 2;
    inside.top = -inside.height / 2;

    this.inLine.setExtent( inside );
    this.redraw();
}

ShapeVis.prototype.doSelectShape = function( event )
{
    var inside = this.inLine.getExtent();
    var outside = this.outLine.getExtent();
    var inLine = null;
    var outLine = null;

    switch( $(this.controls.select).val() )
    {
        case "circle":
	    inLine = new CircleOutline( inside.width );
	    outLine = new CircleOutline( outside.width );
	    break;

        case "ellipse":
	    inLine = new EllipseOutline( inside.width, inside.height );
	    outLine = new EllipseOutline( outside.width, outside.height );
	    break;

        case "square":
	    inLine = new SquareOutline( inside.width );
	    outLine = new SquareOutline( outside.width );
	    break;

        case "diamond":
	    inLine = new DiamondOutline( inside.width );
	    outLine = new DiamondOutline( outside.width );
	    break;

        case "cathedral":
	    inLine = new CathedralOutline( inside.width, inside.height );
	    outLine = new CathedralOutline( outside.width, outside.height );
	    break;

        case "gothic":
	    inLine = new GothicOutline( inside.width, inside.height );
	    outLine = new GothicOutline( outside.width, outside.height );
	    break;

        case "vesica":
	    inLine = new VesicaOutline( inside.width );
	    outLine = new VesicaOutline( outside.width );
	    break;

        default:
	    inLine = new RectangleOutline( inside.width, inside.height );
	    outLine = new RectangleOutline( outside.width, outside.height );
	    break;
    }

    if( inLine && outLine )
    {
	inLine.container = outLine;
	outLine.child = inLine;

	this.inLine = inLine;
	this.outLine = outLine;
	this.handle = this.selected = null;

	$(this.controls.title).val( $(this.controls.select).find( "option:selected" ).text() );
	$(this.controls.title).trigger( "change" );
	this.redraw();
    }
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
    $(this.cost.area).html( (Math.round( area / 14400 ) / 100) + " ft<sup>2</sup> (" +
                             (Math.round( area / 100 ) / 100) + " in<sup>2</sup>)" );
    $(this.cost.total).html( "$" + (Math.round( 325 * area / 14400 ) / 100) );

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

ShapeVis.prototype.mouseMove = function( event )
{
    if( this.handle )
    {
	var point = this.getPosition();
	var dirty = false;

	this.handle.delta = { x: point.x - this.handle.x, y: point.y - this.handle.y };

	if( this.selected == this.outLine )
	    dirty = this.outLine.resize( this.handle, this.isAspectLocked );
	
	if( dirty || this.selected == this.inLine )
	    dirty = this.inLine.resize( this.handle, this.isAspectLocked );

	if( dirty )
        {
	    this.handle.x = point.x; this.handle.y = point.y;
	    this.redraw();
	}
    }
}

ShapeVis.prototype.mouseDown = function( event )
{
    this.handle = this.outLine.getHandle( this.getPosition(), Outline.handleSize / this.zoom );
    if( this.handle )
	this.selected = this.outLine;
    else
    {
	this.handle = this.inLine.getHandle( this.getPosition(), Outline.handleSize / this.zoom );
	if( this.handle )
	    this.selected = this.inLine;
    }
}

ShapeVis.prototype.mouseUp = function( event )
{
    this.handle = null;
    this.selected = null;
}
