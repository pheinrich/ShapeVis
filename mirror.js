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
        title:       panel.find( "div.controls input.shptitle" )[0],
        select:      panel.find( "div.controls select" )[0],
        inWidth:     panel.find( "div.dimensions input.iwidth" )[0],
        inHeight:    panel.find( "div.dimensions input.iheight" )[0],
        outWidth:    panel.find( "div.dimensions input.owidth" )[0],
        outHeight:   panel.find( "div.dimensions input.oheight" )[0],
        border:      panel.find( "div.dimensions input.border" )[0],
        resetBorder: panel.find( "div.dimensions input[type='button']" )[0]
    };

    this.cost = {
        total: panel.find( "div.cost span.total" )[0],
        togdets: panel.find( "div.cost span.togdets" )[0],
	area: panel.find( "div.cost span.area" )[0],
        details: panel.find( "div.cost div.details" )[0],
        base: panel.find( "div.details select.base-material" )[0],
        baseCut:  panel.find( "div.details input.base-cut" )[0],
        baseSub: panel.find( "div.details span.base" )[0],
        opus: panel.find( "div.details select.opus" )[0],
        opusSub: panel.find( "div.details span.tesserae" )[0],
        glassBevel: panel.find( "div.details input.glass-bevel" )[0],
        glassSub: panel.find( "div.details span.glass" )[0]
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

    $(this.cost.togdets).click( function( event ) { $(that.cost.details).toggle( "drop" ) } );
    $(this.cost.details).change( function( event ) { that.updatePrice() } );

    this.canvas.addEventListener( "mousemove", function( event ) { that.mouseMove.call( that, event ) }, false );
    this.canvas.addEventListener( "mousedown", function( event ) { that.mouseDown.call( that, event ) }, false );
    this.canvas.addEventListener( "mouseup",   function( event ) { that.mouseUp.call( that, event ) },   false );

    this.doZoomSlider();
    this.doSelectShape();
}

ShapeVis.basePrice = { birch12: 50 / 16, birch34: 52 / 16, acx12: 60 / 32, acx34: 76 / 32, plexi: 418 / 32 };
ShapeVis.customCutPrice  = 30;
ShapeVis.opusPrice = { tessellatum: 325, palladianum: 350 };
ShapeVis.glassPrice = 8;
ShapeVis.glassBevelPrice = 125; 

ShapeVis.tabTemplate = function( href, label )
{
    return( "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>" );
}

ShapeVis.prototype.pack = function()
{
    var extent = this.outLine.getExtent();
    var params = extent.width + '-' + extent.height;
    var bits = parseInt( $(this.controls.zoomSlider).val() );

    extent = this.inLine.getExtent();
    params += '-' + extent.width + '-' + extent.height;

    if( $(this.cost.baseCut).is( ':checked' ) )
        bits += 4;
    if( $(this.cost.glassBevel).is( ':checked' ) )
        bits += 8;

    params += '-' + bits;
    params += '-' + $(this.controls.select).prop( 'selectedIndex' );
    params += '-' + $(this.cost.base).prop( 'selectedIndex' );
    params += '-' + $(this.cost.opus).prop( 'selectedIndex' );
    params += '-' + $(this.controls.title).val();

    return( params );
}

ShapeVis.prototype.unpack = function( params )
{
    params = params.split( '-' );
    var vals = params.slice( 0, 8 ).map( function( val ) {
        return( parseInt( val ) );
    });

    // Must do these in the correct order, since inside is limited by outside.
    this.outLine.setExtent( { left: -vals[0] / 2, top: -vals[1] / 2, width: vals[0], height: vals[1] } );
    this.inLine.setExtent( { left: -vals[2] / 2, top: -vals[3] / 2, width: vals[2], height: vals[3] } );

    $(this.controls.zoomSlider).val( vals[4] & 0x03 );
    $(this.cost.baseCut).attr( 'checked', 0 != (vals[4] & 0x04) );
    $(this.cost.glassBevel).attr( 'checked', 0 != (vals[4] & 0x08) );
    $(this.controls.select).prop( 'selectedIndex', vals[5] );
    $(this.cost.base).prop( 'selectedIndex', vals[6] );
    $(this.cost.opus).prop( 'selectedIndex', vals[7] );

    this.doZoomSlider();
    this.doSelectShape();

    $(this.controls.title).val( params[8] );
    $(this.controls.title).change();

    this.updatePrice();
}

ShapeVis.prototype.getTarget = function( event )
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

    return( target );
}

ShapeVis.prototype.getPosition = function( event )
{
    if( !event )
	event = window.event;

    var target = this.getTarget( event );
    var x = event.pageX - $(target).offset().left;
    var y = event.pageY - $(target).offset().top;

    return {
	x: (x - this.origin.x) / this.zoom,
	y: (y - this.origin.y) / this.zoom
    };
}

ShapeVis.prototype.getInches = function( control )
{
    return( $(control).val().replace( /^([0-9.+]+).*/, '$1' ) );
}

ShapeVis.prototype.doDimensions = function( event )
{
    var target = this.getTarget( event );
    var extent = {};

    if( target == this.controls.outWidth || target == this.controls.outHeight )
    {
	extent.width = 100 * this.getInches( this.controls.outWidth );
	extent.height = 100 * this.getInches( this.controls.outHeight );
	extent.left = -extent.width / 2;
	extent.top = -extent.height / 2;

	if( this.outLine.setExtent( extent ) )
	{
            this.updatePrice();
	    this.redraw();
	}
    }
    else if( target == this.controls.inWidth || target == this.controls.inHeight )
    {
	extent.width = 100 * this.getInches( this.controls.inWidth );
	extent.height = 100 * this.getInches( this.controls.inHeight );
	extent.left = -extent.width / 2;
	extent.top = -extent.height / 2;

	if( this.inLine.setExtent( extent ) )
	{
	    this.updatePrice();
	    this.redraw();
	}
    }
    else if( target == this.controls.border )
    {
	var border = 100 * this.getInches( this.controls.border );
	var outside = this.outLine.getExtent();

	extent.width = outside.width - 2*border;
	extent.height = outside.height - 2*border;
	extent.left = -extent.width / 2;
	extent.top = -extent.height / 2;

	if( this.inLine.setExtent( extent ) )
	{
	    this.updatePrice();
	    this.redraw();
	}
    }
}

ShapeVis.prototype.updatePrice = function()
{
    this.area = this.outLine.getArea() - this.inLine.getArea();
    $(this.cost.area).html( (this.area / 1440000).toFixed( 2 ) + ' ft<sup>2</sup> (' + (this.area / 10000).toFixed( 2 ) + ' in<sup>2</sup>)' );

    var extent = this.outLine.getExtent();
    var baseSub = extent.width * extent.height / 1440000 * ShapeVis.basePrice[ $(this.cost.base).val() ];
    var opusSub = this.area / 1440000 * ShapeVis.opusPrice[ $(this.cost.opus).val() ];

    if( $(this.cost.baseCut).is( ":checked" ) )
	baseSub += ShapeVis.customCutPrice;

    $(this.cost.baseSub).html( '$' + baseSub.toFixed( 2 ) );
    $(this.cost.opusSub).html( '$' + opusSub.toFixed( 2 ) );

    extent = this.inLine.getExtent();
    var glassSub = extent.width * extent.height / 1440000 * ShapeVis.glassPrice;

    if( $(this.cost.glassBevel).is( ":checked" ) )
	glassSub += ShapeVis.glassBevelPrice;

    $(this.cost.glassSub).html( '$' + glassSub.toFixed( 2 ) );
    $(this.cost.total).html( '$' + (baseSub + opusSub + glassSub).toFixed( 2 ) );
}

ShapeVis.prototype.doLockAspect = function( event )
{
    this.isAspectLocked = $(this.controls.lockAspect).is( ":checked" );
}

ShapeVis.prototype.doZoomSlider = function( event )
{
    var value = $(this.controls.zoomSlider).val();

    this.zoom = Math.pow( 1.5, value - 7 );
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
    this.updatePrice();
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

	$(this.controls.title).val( $(this.controls.select).find( "option:selected" ).text().trim() );
	$(this.controls.title).trigger( "change" );

	this.updatePrice();
	this.redraw();
    }
}

ShapeVis.prototype.draw = function()
{
    var outside = this.outLine.getExtent();
    var inside = this.inLine.getExtent();

    $(this.controls.outWidth).val( (Math.round( outside.width ) / 100) + " in" );
    $(this.controls.outHeight).val( (Math.round( outside.height ) / 100) + " in" );

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

    $(this.controls.inWidth).val( (Math.round( inside.width ) / 100) + " in" );
    $(this.controls.inHeight).val( (Math.round( inside.height ) / 100) + " in" );

    if( outside.width - inside.width == outside.height - inside.height )
	$(this.controls.border).val( (Math.round( outside.width - inside.width ) / 200) + " in" );
    else
	$(this.controls.border).val( "" );

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
	else if( this.selected == this.inLine )
	    dirty = this.inLine.resize( this.handle, this.isAspectLocked );

	if( dirty )
        {
	    this.handle.x = point.x; this.handle.y = point.y;
            this.updatePrice();
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
