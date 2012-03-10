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

RectangleOutline.prototype = new Outline;
RectangleOutline.prototype.constructor = RectangleOutline;
function RectangleOutline( width, height )
{
    Outline.call( this );

    this.left   = -width / 2;
    this.top    = -height / 2;
    this.width  = width;
    this.height = height;
}

RectangleOutline.prototype.getHandle = function( point )
{
    var pos = 0;
    var offset = { x: point.x - this.left, y: point.y - this.top };

    if( Outline.handleSize > Math.abs( offset.y ) )
	pos += Outline.handlePos.N;
    else if( Outline.handleSize > Math.abs( offset.y - this.height ) )
	pos += Outline.handlePos.S;

    if( Outline.handleSize > Math.abs( offset.x ) )
	pos += Outline.handlePos.W;
    else if( Outline.handleSize > Math.abs( offset.x - this.width ) )
	pos += Outline.handlePos.E;

    return( pos ? { x: point.x, y: point.y, pos: pos } : null );
}

RectangleOutline.prototype.resize = function( handle, point, limit )
{
    var valid = false;

    if( handle )
    {
        var delta = { x: point.x - handle.x, y: point.y - handle.y };
	var rect  = { left: this.left, top: this.top, width: this.width, height: this.height };

	if( Outline.handlePos.N & handle.pos )
	{
	    rect.top += delta.y;
	    rect.height -= 2*delta.y;
	}
	else if( Outline.handlePos.S & handle.pos )
	{
	    rect.top -= delta.y;
	    rect.height += 2*delta.y;
	}

	if( Outline.handlePos.W & handle.pos )
	{
	    rect.left += delta.x;
	    rect.width -= 2*delta.x;
	}
	else if( Outline.handlePos.E & handle.pos )
	{
	    rect.left -= delta.x;
	    rect.width += 2*delta.x;
	}

	valid = !limit || limit( rect );
	if( valid )
	{
	    this.left   = rect.left;
	    this.top    = rect.top;
	    this.width  = rect.width;
	    this.height = rect.height;

	    handle.x = point.x;
	    handle.y = point.y;
	}
    }

    return( valid );
}

RectangleOutline.prototype.getExtent = function()
{
    return( { left: this.left, top: this.top, width: this.width, height: this.height } );
}

RectangleOutline.prototype.trace = function( context )
{
    context.beginPath();
    context.rect( this.left, this.top, this.width, this.height );
}
