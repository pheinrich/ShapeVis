function handle( x, y, size, color )
{
  this.x = x;
  this.y = y;

  this.draw = function( svg )
  {
    svg.rect( x, y, size, size, {fill: color} );
  }
}

function selection( x, y, width, height, color )
{
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.handles = [];

  this.createHandles = function(size)
  {
    dx = (this.width - size) / 2;
    dy = (this.height - size) / 2;

    for( i = 0, u = this.x, horz = -1; horz <= 1; u += dx, horz++ )
    {
      for( v = this.y, vert = -1; vert <= 1; v += dy, vert++ )
      {
        if( !(horz || vert) )
          continue;

        this.handles[ i++ ] = new handle( u, v, size, color );
      }
    }
  }

  this.draw = function( svg )
  {
    svg.rect( this.x, this.y, this.width, this.height, {fill: 'none', stroke: color, strokeWidth: 1} );

    this.handles.forEach(function(element) {
      element.draw( svg );
    });
  }

  this.createHandles( 8 );
}
