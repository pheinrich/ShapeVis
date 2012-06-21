SQRT3 = Math.sqrt( 3 );

Function.prototype.inheritsFrom = function( parentClass )
{
    if( Function == parentClass.constructor )
    {
	this.prototype = new parentClass;
	this.prototype.constructor = this;
	this.prototype.parent = parentClass.prototype;
    }
    else
    {
	this.prototype = parentClass;
	this.prototype.constructor = this;
	this.prototype.parent = parentClass;
    }

    return( this );
}

function Outline()
{
}

Outline.handleSize = 5;
Outline.handlePos = { N: 1 << 0, E: 1 << 1, W: 1 << 2, S: 1 << 3 };
 
Outline.prototype.getHandle = function( point )
{
    return null;
}

Outline.prototype.resize = function( handle, point, limit )
{
    return null;
}

Outline.prototype.getExtent = function()
{
    return( { left: 0, top: 0, width: 0, height: 0 } );
}

Outline.prototype.setExtent = function( extent )
{
    var childExtent = null;

    // If we contain another outline, make sure our change will allow that one
    // to assume valid dimensions, as well.  If it won't, childExtent will be
    // null.
    if( this.child )
    {
        var delta = { x: this.left - extent.left, y: this.top - extent.top };

	childExtent = this.child.getExtent();

	childExtent.left   -= delta.x;
	childExtent.top    -= delta.y;
	childExtent.width  += 2*delta.x;
	childExtent.height += 2*delta.y;

	if( childExtent.width <= 0 || childExtent.height <= 0 )
	    childExtent = null;
    }

    if( !this.child || childExtent )
    {
	// If we're contained inside another outline, make sure our bounding
	// box is smaller than our parent's.
	if( this.container )
	{
	    if( extent.left <= this.container.left ||
		extent.left + extent.width >= this.container.left + this.container.width ||
		extent.top <= this.container.top ||
		extent.top + extent.height >= this.container.top + this.container.height )
		    extent = null;
	}

	// If there's still a bounding rect we can use, change our dimensions.
	if( extent )
	{
	    this.left   = extent.left;
	    this.top    = extent.top;
	    this.width  = extent.width;
	    this.height = extent.height;
	}
    }

    //  If we successfully changed our size, change our child, if appropriate.
    if( extent && childExtent )
	this.child.setExtent( childExtent );

    return( extent );
}

Outline.prototype.computeExtentFrom = function( extent )
{
    return( { left: this.left, top: this.top, width: this.width, height: this.height } );
}

Outline.prototype.getArea = function()
{
    return( 0 );
}

Outline.prototype.trace = function( context )
{
}

function RectangleOutline( width, height )
{
    Outline.call( this );

    this.left   = -width / 2;
    this.top    = -height / 2;
    this.width  = width;
    this.height = height;
}

RectangleOutline.inheritsFrom( Outline );

RectangleOutline.prototype.getHandle = function( point, handleSize )
{
    var offset = { x: point.x - this.left, y: point.y - this.top };
    var pos = 0;

    if( handleSize > Math.abs( offset.y ) )
	pos += Outline.handlePos.N;
    else if( handleSize > Math.abs( offset.y - this.height ) )
	pos += Outline.handlePos.S;

    if( handleSize > Math.abs( offset.x ) )
	pos += Outline.handlePos.W;
    else if( handleSize > Math.abs( offset.x - this.width ) )
	pos += Outline.handlePos.E;

    return( pos ? { x: point.x, y: point.y, pos: pos } : null );
}

RectangleOutline.prototype.resize = function( handle, lockAspect )
{
    var valid = false;

    if( handle )
    {
	var rect  = { left: this.left, top: this.top, width: this.width, height: this.height };
        var delta = { x: handle.delta.x, y: handle.delta.y };

	if( Outline.handlePos.N & handle.pos )
	    rect.height -= 2*handle.delta.y;
	else if( Outline.handlePos.S & handle.pos )
	    rect.height += 2*handle.delta.y;

	if( Outline.handlePos.W & handle.pos )
	    rect.width -= 2*handle.delta.x;
	else if( Outline.handlePos.E & handle.pos )
	    rect.width += 2*handle.delta.x;

	if( lockAspect && 0 < this.width && 0 < this.height )
        {
	    if( Math.abs( handle.delta.x ) < Math.abs( handle.delta.y ) )
		rect.width = rect.height * this.width / this.height;
	    else
		rect.height = rect.width * this.height / this.width;

	    delta.x = (rect.width - this.width) / 2;
	    delta.y = (rect.height - this.height) / 2;
	}

	rect.left = -rect.width / 2;
	rect.top = -rect.height / 2;

	valid = (null != this.setExtent( rect ));
        if( valid )
	{
	    handle.delta.x = delta.x;
	    handle.delta.y = delta.y;
	}
    }

    return( valid );
}

RectangleOutline.prototype.getExtent = function()
{
    return( { left: this.left, top: this.top, width: this.width, height: this.height } );
}

/*
RectangleOutline.prototype.setExtent = function( rect )
{
    rect.left = -rect.width / 2;
    rect.top = -rect.height / 2;

    this.left   = rect.left;
    this.top    = rect.top;
    this.width  = rect.width;
    this.height = rect.height;

    return( true );
}
*/

RectangleOutline.prototype.getArea = function()
{
    return( this.width * this.height );
}

RectangleOutline.prototype.trace = function( context )
{
    context.beginPath();
    context.rect( this.left, this.top, this.width, this.height );
}

function SquareOutline( width )
{
    RectangleOutline.call( this, width, width );
}

SquareOutline.inheritsFrom( RectangleOutline );

SquareOutline.prototype.resize = function( handle, lockAspect )
{
    return( SquareOutline.prototype.parent.resize.call( this, handle, true ) );
}

function CathedralOutline( width, height )
{
    RectangleOutline.call( this, width, height );
}

CathedralOutline.inheritsFrom( RectangleOutline );

CathedralOutline.prototype.contains = function( point, a, b )
{
    var inside = false;
    var h = a - b;

    if( point.y < h )
    {
	h -= point.y;
	inside = (a*a) > (point.x*point.x) + (h*h);
    }
    else
	inside = Math.abs( point.x ) < a && Math.abs( point.y ) < b;

    return( inside );
}

CathedralOutline.prototype.getHandle = function( point, handleSize )
{
    var outsideMin = !this.contains( point, (this.width - handleSize) / 2, (this.height - handleSize) / 2 );
    var insideMax = this.contains( point, (this.width + handleSize) / 2, (this.height + handleSize) / 2 );
    var pos = 0;

    if( outsideMin && insideMax )
    {
	// Check if selecting upper (circular) edge.
	if( 2 * point.y < this.width - this.height )
	{
	    pos = Outline.handlePos.N;
	    if( handleSize < Math.abs( point.x ) )
		pos += (0 < point.x) ? Outline.handlePos.E : Outline.handlePos.W;
	}
	else
	{
	    var offset = { x: point.x - this.left, y: point.y - this.top };

	    if( handleSize > Math.abs( offset.y - this.height ) )
		pos = Outline.handlePos.S;

	    if( handleSize > Math.abs( offset.x ) )
		pos += Outline.handlePos.W;
	    else if( handleSize > Math.abs( offset.x - this.width ) )
		pos += Outline.handlePos.E;
	}
    }

    return( pos ? { x: point.x, y: point.y, pos: pos } : null );
}

CathedralOutline.prototype.limit = function( outline, rect, handle )
{
    if( outline.container && handle && (Outline.handlePos.S & handle.pos) )
    {
	rect.top = outline.top;
	rect.height += (outline.height - rect.height) / 2;
    }

    return( true );
}

CathedralOutline.prototype.getArea = function()
{
    return( this.width * (this.height - this.width/2 * (1 - Math.PI/4)) );
}

CathedralOutline.prototype.trace = function( context )
{
    var radius = this.width / 2;
    var bottom = this.top + this.height;

    context.beginPath();
    context.arc( 0, this.top + radius, radius, Math.PI, 0, false );
    context.lineTo( radius, bottom );
    context.lineTo( -radius, bottom );
    context.closePath();
}

function GothicOutline( width, height )
{
    RectangleOutline.call( this, width, height );
}

GothicOutline.inheritsFrom( RectangleOutline );

GothicOutline.prototype.contains = function( point, a, b )
{
    return( GothicOutline.prototype.parent.contains.call( this, point, a, b ) );
}

GothicOutline.prototype.getHandle = function( point, handleSize )
{
    return( GothicOutline.prototype.parent.getHandle.call( this, point, handleSize ) );
}

GothicOutline.prototype.getArea = function()
{
    return( GothicOutline.prototype.parent.getArea.call( this ) );
}

GothicOutline.prototype.trace = function( context )
{
    if( this.container )
    {
	var border = (this.container.width - this.width) / 2;
	var radius = (this.container.width + this.width) / 2;
	var a = Math.acos( this.container.width / (2*radius) );
	var y = (SQRT3*this.container.width - this.container.height) / 2;
	var bottom = Math.min( this.container.height - border, y - (radius * Math.sin( a )) + this.height );

	context.beginPath();
	context.arc( this.container.width / 2, y, radius, Math.PI, Math.PI + a, false );
	context.arc( -this.container.width / 2, y, radius, -a, 0, false );
	context.lineTo( this.width / 2, bottom );
	context.lineTo( -this.width / 2, bottom );
	context.closePath();
    }
    else
    {
	var y = (SQRT3*this.width - this.height) / 2;

	context.beginPath();
	context.arc( this.width / 2, y, this.width, Math.PI, 4*Math.PI/3, false );
	context.arc( -this.width / 2, y, this.width, 5*Math.PI/3, 0, false );
	context.lineTo( this.width / 2, this.height / 2 );
	context.lineTo( -this.width / 2, this.height / 2 );
	context.closePath();
    }
}

function EllipseOutline( width, height )
{
    RectangleOutline.call( this, width, height );
}

EllipseOutline.inheritsFrom( RectangleOutline );

EllipseOutline.prototype.contains = function( point, a, b )
{
    return( 1 > (point.x*point.x)/(a*a) + (point.y*point.y)/(b*b) );
}

EllipseOutline.prototype.getHandle = function( point, handleSize )
{
    var outsideMin = !this.contains( point, (this.width - handleSize) / 2, (this.height - handleSize) / 2 );
    var insideMax = this.contains( point, (this.width + handleSize) / 2, (this.height + handleSize) / 2 );
    var pos = 0;

    if( outsideMin && insideMax )
    {
	if( handleSize < Math.abs( point.x ) )
	    pos += (0 < point.x) ? Outline.handlePos.E : Outline.handlePos.W;

	if( handleSize < Math.abs( point.y ) )
	    pos += (0 < point.y) ? Outline.handlePos.S : Outline.handlePos.N;
    }

    return( pos ? { x: point.x, y: point.y, pos: pos } : null );
}

EllipseOutline.prototype.getArea = function()
{
    return( Math.PI/4 * this.width * this.height );
}

EllipseOutline.prototype.trace = function( context )
{
    context.save();
    context.beginPath();
    context.scale( this.width / 2, this.height / 2 );
    context.arc( 0, 0, 1, 0, 2*Math.PI, false );
    context.restore();
}

function CircleOutline( diameter )
{
    EllipseOutline.call( this, diameter, diameter );
}

CircleOutline.inheritsFrom( EllipseOutline );

CircleOutline.prototype.resize = function( handle, lockAspect )
{
    return( CircleOutline.prototype.parent.resize.call( this, handle, true ) );
}

function DiamondOutline( width )
{
    CircleOutline.call( this, width );
}

DiamondOutline.inheritsFrom( CircleOutline );

DiamondOutline.prototype.contains = function( point, a, b )
{
    return( a > Math.abs( point.x ) + Math.abs( point.y ) );
}

DiamondOutline.prototype.getArea = function()
{
    return( 0.5 * this.width * this.width );
}

DiamondOutline.prototype.trace = function( context )
{
    context.beginPath();
    context.moveTo( this.left, 0 )
    context.lineTo( 0, this.top );
    context.lineTo( this.left + this.width, 0 );
    context.lineTo( 0, this.top + this.height );
    context.closePath();
}
