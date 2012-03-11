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

function RectangleOutline( width, height )
{
    Outline.call( this );

    this.left   = -width / 2;
    this.top    = -height / 2;
    this.width  = width;
    this.height = height;
}

RectangleOutline.inheritsFrom( Outline );

RectangleOutline.prototype.getHandle = function( point, zoom )
{
    var handleSize = Outline.handleSize / zoom;
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

RectangleOutline.prototype.resize = function( handle, limit, lockAspect )
{
    var valid = false;

    if( handle )
    {
	var rect  = { left: this.left, top: this.top, width: this.width, height: this.height };

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
	    if( (Outline.handlePos.N | Outline.handlePos.S) & handle.pos )
		rect.width = rect.height * this.width / this.height;
	    else
		rect.height = rect.width * this.height / this.width;
	}

	rect.left = -rect.width / 2;
	rect.top = -rect.height / 2;

	valid = !limit || limit( rect );
	if( valid )
	{
	    this.left   = rect.left;
	    this.top    = rect.top;
	    this.width  = rect.width;
	    this.height = rect.height;
	}
    }

    return( valid );
}

RectangleOutline.prototype.getExtent = function()
{
    return( { left: this.left, top: this.top, width: this.width, height: this.height } );
}

RectangleOutline.prototype.setExtent = function( rect )
{
    this.left   = rect.left;
    this.top    = rect.top;
    this.width  = rect.width;
    this.height = rect.height;
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

SquareOutline.prototype.resize = function( handle, limit, lockAspect )
{
    return( this.parent.resize.call( this, handle, limit, true ) );
}

function EllipseOutline( width, height )
{
    RectangleOutline.call( this, width, height );
}

EllipseOutline.inheritsFrom( RectangleOutline );

EllipseOutline.contains = function( point, a, b )
{
    return( 1 > (point.x*point.x)/(a*a) + (point.y*point.y)/(b*b) );
}

EllipseOutline.prototype.getHandle = function( point, zoom )
{
    var handleSize = Outline.handleSize / zoom;
    var outsideMin = !EllipseOutline.contains( point, (this.width - handleSize) / 2, (this.height - handleSize) / 2 );
    var insideMax = EllipseOutline.contains( point, (this.width + handleSize) / 2, (this.height + handleSize) / 2 );
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

EllipseOutline.prototype.trace = function( context )
{
    context.save();
    context.beginPath();
    context.scale( this.width / 2, this.height / 2 );
    context.arc( 0, 0, 1, 0, 2*Math.PI, false );
    context.restore();
}
