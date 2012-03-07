SQRT3 = Math.sqrt( 3 );

function getPosition( event )
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

    return {
	x: event.pageX - $(target).offset().left,
	y: event.pageY - $(target).offset().top
    };
}

function Shape( insideWidth, outsideWidth, insideHeight, outsideHeight )
{
    this.insideWidth   = insideWidth   || 0;
    this.outsideWidth  = outsideWidth  || 0;
    this.insideHeight  = insideHeight  || 0;
    this.outsideHeight = outsideHeight || 0;
}

Shape.prototype.draw = function( context )
{
    var cx = (context.canvas.width - this.outsideWidth) / 2;
    var cy = (context.canvas.height - this.outsideHeight) / 2;

    context.save();
    context.translate( cx, cy );

    // Draw frame.
    context.fillStyle = "#eda";
    context.strokeStyle = "#000";
    context.lineWidth = 3;
    this.traceOutside( context );
    context.fill();
    context.stroke();

    var gradient = context.createLinearGradient( 0, 0, this.outsideWidth, this.outsideHeight );
    gradient.addColorStop( 0, "#aaa" );
    gradient.addColorStop( 1, "#fff" );

    // Draw mirror.
    context.fillStyle = gradient;
    context.lineWidth = 2;
    this.traceInside( context );
    context.fill();
    context.stroke();

    context.restore();
}

Ellipse.prototype = new Shape;
Ellipse.prototype.constructor = Ellipse;
function Ellipse( insideWidth, outsideWidth, insideHeight, outsideHeight )
{
    Shape.call( this, insideWidth, outsideWidth, insideHeight, outsideHeight );
}

Ellipse.prototype.traceOutside = function( context )
{
    var rx = this.outsideWidth / 2;
    var ry = this.outsideHeight / 2;

    context.save();
    context.beginPath();
    context.translate( rx, ry );
    context.scale( rx, ry );
    context.arc( 0, 0, 1, 0, 2 * Math.PI, false );
    context.restore();
}

Ellipse.prototype.traceInside = function( context )
{
    var cx = this.outsideWidth / 2;
    var cy = this.outsideHeight / 2;
    var rx = this.insideWidth / 2;
    var ry = this.insideHeight / 2;

    context.save();
    context.beginPath();
    context.translate( cx, cy );    
    context.scale( rx, ry );
    context.arc( 0, 0, 1, 0, 2 * Math.PI, false );
    context.restore();
}

Circle.prototype = new Ellipse;
Circle.prototype.constructor = Circle;
function Circle( insideWidth, outsideWidth )
{
    Ellipse.call( this, insideWidth, outsideWidth, insideWidth, outsideWidth );
}

Rectangle.prototype = new Shape;
Rectangle.prototype.constructor = Rectangle;
function Rectangle( insideWidth, outsideWidth, insideHeight, outsideHeight )
{
    Shape.call( this, insideWidth, outsideWidth, insideHeight, outsideHeight );
}

Rectangle.prototype.traceOutside = function( context )
{
    context.beginPath();
    context.rect( 0, 0, this.outsideWidth, this.outsideHeight );
}

Rectangle.prototype.traceInside = function( context )
{
    context.beginPath();
    context.rect( (this.outsideWidth - this.insideWidth) / 2,
		  (this.outsideHeight - this.insideHeight) / 2,
		  this.insideWidth,
		  this.insideHeight );
}

Square.prototype = new Rectangle;
Square.prototype.constructor = Square;
function Square( insideWidth, outsideWidth )
{
    Rectangle.call( this, insideWidth, outsideWidth, insideWidth, outsideWidth );
}

Diamond.prototype = new Shape;
Diamond.prototype.constructor = Diamond;
function Diamond( insideWidth, outsideWidth )
{
    Shape.call( this, insideWidth, outsideWidth, insideWidth, outsideWidth );
}

Diamond.prototype.traceOutside = function( context )
{
    context.beginPath();
    context.moveTo( 0, this.outsideHeight / 2 );
    context.lineTo( this.outsideWidth / 2, 0 );
    context.lineTo( this.outsideWidth, this.outsideHeight / 2 );
    context.lineTo( this.outsideWidth / 2, this.outsideHeight );
    context.closePath();
}

Diamond.prototype.traceInside = function( context )
{
    var d = (this.outsideWidth - this.insideWidth) / 2;

    context.save();
    context.translate( d, d );

    context.beginPath();
    context.moveTo( 0, this.insideHeight / 2 );
    context.lineTo( this.insideWidth / 2, 0 );
    context.lineTo( this.insideWidth, this.insideHeight / 2 );
    context.lineTo( this.insideWidth / 2, this.insideHeight );
    context.closePath();

    context.restore();
}

Cathedral.prototype = new Shape;
Cathedral.prototype.constructor = Cathedral;
function Cathedral( insideWidth, outsideWidth, insideHeight, outsideHeight )
{
    Shape.call( this, insideWidth, outsideWidth, insideHeight, outsideHeight );
}

Cathedral.prototype.traceOutside = function( context )
{
    var radius = this.outsideWidth / 2;

    context.beginPath();
    context.arc( radius, radius, radius, 0, Math.PI, true );
    context.lineTo( 0, this.outsideHeight );
    context.lineTo( this.outsideWidth, this.outsideHeight );
    context.closePath();
}

Cathedral.prototype.traceInside = function( context )
{
    var radius = this.outsideWidth / 2;
    var border = (this.outsideWidth - this.insideWidth) / 2;

    context.beginPath();
    context.arc( radius, radius, radius - border, Math.PI, 0, false );
    context.lineTo( this.outsideWidth - border, this.insideHeight + border );
    context.lineTo( border, this.insideHeight + border );
    context.closePath();
}

Gothic.prototype = new Shape;
Gothic.prototype.constructor = Gothic;
function Gothic( insideWidth, outsideWidth, insideHeight, outsideHeight )
{
    Shape.call( this, insideWidth, outsideWidth, insideHeight, outsideHeight );
}

Gothic.prototype.traceOutside = function( context )
{
    var y = SQRT3 * this.outsideWidth / 2;

    context.beginPath();
    context.arc( this.outsideWidth, y, this.outsideWidth, Math.PI, 4*Math.PI/3, false );
    context.arc( 0, y, this.outsideWidth, 5*Math.PI/3, 0, false );
    context.lineTo( this.outsideWidth, this.outsideHeight );
    context.lineTo( 0, this.outsideHeight );
    context.closePath();
}

Gothic.prototype.traceInside = function( context )
{
    var border = (this.outsideWidth - this.insideWidth) / 2;
    var radius = (this.outsideWidth + this.insideWidth) / 2;
    var a = Math.acos( this.outsideWidth / (2*radius) );
    var y = SQRT3 * this.outsideWidth / 2;
    var bottom = Math.min( this.outsideHeight - border, y - (radius * Math.sin( a )) + this.insideHeight );

    context.save();
    context.beginPath();
    context.arc( this.outsideWidth, y, radius, Math.PI, Math.PI + a, false );
    context.arc( 0, y, radius, -a, 0, false );
    context.lineTo( this.insideWidth + border, bottom );
    context.lineTo( border, bottom );
    context.closePath();
    context.restore();
}

Vesica.prototype = new Shape;
Vesica.prototype.constructor = Vesica;
function Vesica( insideWidth, outsideWidth )
{
    Shape.call( this );
    this.setOutsideWidth( outsideWidth );
    this.setInsideWidth( insideWidth );
}

Vesica.prototype.setOutsideWidth = function( outsideWidth )
{
    this.outsideWidth  = outsideWidth;
    this.outsideHeight = this.outsideWidth * SQRT3;
    return( true );
}

Vesica.prototype.setOutsideHeight = function( outsideHeight )
{
    this.outsideHeight = outsideHeight;
    this.outsideWidth  = this.outsideWidth / SQRT3;
    return( true );
}

Vesica.prototype.setInsideWidth = function( insideWidth )
{
    var valid = false;

    if( insideWidth < this.outsideWidth )
    {
	this.insideWidth = insideWidth;
	this.insideHeight = Math.sqrt( 2*this.insideWidth * (this.outsideWidth + this.insideWidth) );
	valid = true;
    }

    return( valid );
}

Vesica.prototype.setInsideHeight = function( insideHeight )
{
    var valid = false;

    if( insideHeight < this.outsideHeight )
    {
	this.insideHeight = insideHeight;
	this.insideWidth  = (Math.sqrt( this.outsideWidth*this.outsideWidth +
					2*this.insideHeight*this.insideHeight ) -
			     this.outsideWidth) / 2;
	valid = true;
    }

    return( valid );
}

Vesica.prototype.traceOutside = function( context )
{
    context.beginPath();
    context.arc( this.outsideWidth, this.outsideHeight / 2, this.outsideWidth, 2*Math.PI/3, 4*Math.PI/3, false );
    context.arc( 0, this.outsideHeight / 2, this.outsideWidth, 5*Math.PI/3, Math.PI/3, false );
    context.closePath();
}

Vesica.prototype.traceInside = function( context )
{
    var border = (this.outsideWidth - this.insideWidth) / 2;
    var radius = (this.outsideWidth + this.insideWidth) / 2;
    var a = Math.acos( this.outsideWidth / (2*radius) );
    var y = SQRT3 * this.outsideWidth / 2;

    context.save();
    context.beginPath();
    context.arc( this.outsideWidth, y, radius, Math.PI - a, Math.PI + a, false );
    context.arc( 0, y, radius, -a, a, false );
    context.closePath();
    context.restore();
}


function ShapeVis( sectionId )
{
    this.root = $(sectionId);
    this.canvas = this.root.find( "canvas" )[0];
    this.context = this.canvas.getContext( "2d" );

    this.shapes = [];
    this.current = '';

    var self = this;
    this.canvas.addEventListener( "mousemove", function( event ) {
	    self.mouseMove( event );
	}, false );
}

ShapeVis.prototype.mouseMove = function( event )
{
    var position = getPosition( event );
    var message = "Mouse position: " + position.x + ", " + position.y;

    this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
    this.context.font = "18pt Calibri";
    this.context.fillStyle = "black";
    this.context.fillText( message, 10, 25 );
}

ShapeVis.prototype.updateShapes = function( sectionId )
{
    // Collect all the shapes in the section specified.
    this.shapes = $(sectionId).find( 'UL.shapes LI' );
    this.current = '';

    if( 0 < this.shapes.length )
    {
	// Find the selected one(s).  If none, select the first.
	this.current = $(this.shapes).filter( ".selected" )[0];
	if( typeof( this.current ) == "undefined" )
	    this.current = this.shapes[0];

	// Clear all selections, so we can ensure only one at a time.
	this.shapes.each( function() {
		$(this).removeClass( "selected" );
	    });

	// Force just one to be selected.
	$(this.current).addClass( "selected" );
    }
}

ShapeVis.prototype.draw = function()
{
    //    var shape = new Ellipse( 100, 200, 300, 400 );
    //    var shape = new Circle( 300, 400 );
    //    var shape = new Rectangle( 100, 200, 300, 400 );
    //    var shape = new Square( 300, 400 );
       var shape = new Diamond( 300, 400 );
    //    var shape = new Cathedral( 100, 200, 300, 400 );
    //    var shape = new Gothic( 100, 200, 300, 400 );
    //    var shape = new Vesica( 100, 200, 300, 400 );
    shape.draw( this.context );
}
