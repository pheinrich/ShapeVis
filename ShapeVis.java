// ------------------------------------------------------------------------------------------------
//  Zetamari
//
//  Copyright (c) 2004,2010  Peter Heinrich
//  All Rights Reserved
// ------------------------------------------------------------------------------------------------



import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.font.FontRenderContext;
import java.awt.font.GlyphVector;
import java.awt.font.LineMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.AffineTransform;
import java.awt.geom.Arc2D;
import java.awt.geom.Area;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.RenderedImage;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import javax.imageio.ImageIO;
   


/**
 *  This class creates a dynamic image representing a standard mirror shape
 *  with customized dimensions.  It's meant to provide a visual approximation
 *  of the shapes described for the area calculators.
 *  <p/>
 *  It may choose to cache the generated images, but that's an optimization
 *  that may not be necessary, given the expected traffic to the calculator
 *  page.
 *
 *  @author Peter Heinrich
 *  @version $Revision:$
 */
public class ShapeVis
{
   public static final String PARAM_CANVAS_WIDTH = "cw";
   public static final String PARAM_CANVAS_HEIGHT = "ch";
   public static final String PARAM_SHAPE = "s";
   public static final String PARAM_TITLE = "t";
   public static final String PARAM_SHOW_KEY = "sk";
   public static final String PARAM_WIDTH = "w";
   public static final String PARAM_HEIGHT = "h";
   public static final String PARAM_BORDER = "b";
   public static final String PARAM_ALLOWANCE = "a";
   public static final String PARAM_INSIDE_WIDTH = "iw";
   public static final String PARAM_INSIDE_HEIGHT = "ih";

   public static final int CATHEDRAL = 1;
   public static final int CATHEDRAL2 = 2;
   public static final int CIRCLE = 3;
   public static final int ELLIPSE = 4;
   public static final int RECTANGLE = 5;
   public static final int SQUARE = 6;
   public static final int VESICA = 7;

   public static final int     DEFAULT_CANVAS_WIDTH  = 320;
   public static final int     DEFAULT_CANVAS_HEIGHT = 480;
   public static final boolean DEFAULT_ESTIMATE_GLASS = true;
   public static final double  DEFAULT_PRICE_PER_FOOT = 325.0;
   public static final boolean DEFAULT_SHOW_TITLE = true;
   public static final boolean DEFAULT_SHOW_KEY = true;
   public static final boolean DEFAULT_SHOW_PRICE = false;

   private Map<String, String> m_Params;
   private Font m_Font;
   private Point m_CanvasSize;
   private String m_sTitle;
   private boolean m_bShowKey;


   
   /**
    *  Returns a PNG image we generate on-the-fly representing a particular shape
    *  with a specific set of dimensions.
    *
    *  @param request a <code>HttpServletRequest</code> describing the shape we should render
    *  @param response the <code>HttpServletResponse</code> where we'll be sending our image
    */
   public static void main( String[] args )
   {
      ShapeVis sv = new ShapeVis( args[ 0 ] );
      RenderedImage image = sv.visualize();

      if( null != image )
      {
	 System.out.println( "Content-type: image/png\n" );
	 try
	 {
	    ImageIO.write( image, "png", System.out );
	 }
	 catch( IOException ioe ) {}
      }
      else
      {
	 System.out.println( "Content-tytpe: text/html\n" );
	 System.out.println( "Error creating image<br/>" );
      }
   }

   ShapeVis( String args )
   {
      String[] params = args.split( "&" );

      m_Params = new HashMap<String, String>();  
      for( String param : params )  
      {
	 try
	 {
	    String name = URLDecoder.decode( param.split( "=" )[ 0 ], "UTF-8" );
	    String value = URLDecoder.decode( param.split( "=" )[ 1 ], "UTF-8" );
	    m_Params.put( name, value );
	 }
	 catch( UnsupportedEncodingException uee ) {}
      }  

      //  Create our font and retrieve the target size, if provided.
      m_Font = new Font( "SansSerif", Font.PLAIN, 12 );
      m_CanvasSize = new Point( getIntParam( PARAM_CANVAS_WIDTH, DEFAULT_CANVAS_WIDTH ),
				getIntParam( PARAM_CANVAS_HEIGHT, DEFAULT_CANVAS_HEIGHT ) );

      //  Determine if we should include a title, size key, and/or price in the image.
      m_sTitle = getStringParam( PARAM_TITLE );
      m_bShowKey = getBooleanParam( PARAM_SHOW_KEY );
   }

   public RenderedImage visualize()
   {
      RenderedImage image = null;

      //  Draw the shape requested.
      switch( getIntParam( PARAM_SHAPE ) )
      {
         case CATHEDRAL:
         case CATHEDRAL2:
	 {
	    double dBorder = getDoubleParam( PARAM_BORDER );
            
	    image = renderCathedral( getDoubleParam( PARAM_WIDTH ),
				     getDoubleParam( PARAM_HEIGHT ),
				     dBorder,
				     getDoubleParam( PARAM_BORDER, dBorder ) );
	    break;
	 }

	 case CIRCLE:
	 case ELLIPSE:
	 {
	    double dOutsideWidth = getDoubleParam( PARAM_WIDTH );
	    double dInsideWidth  = getDoubleParam( PARAM_INSIDE_WIDTH );

	    image = renderEllipse( dOutsideWidth,
				   getDoubleParam( PARAM_HEIGHT, dOutsideWidth ),
				   dInsideWidth,
				   getDoubleParam( PARAM_INSIDE_HEIGHT, dInsideWidth ) );
	    break;
	 }

         case RECTANGLE:
         case SQUARE:
	 {
	    double dWidth = getDoubleParam( PARAM_WIDTH );

	    image = renderRectangle( dWidth,
				     getDoubleParam( PARAM_HEIGHT, dWidth ),
				     getDoubleParam( PARAM_BORDER ) );
	    break;
	 }

         case VESICA:
	    image = renderVesica( getDoubleParam( PARAM_WIDTH ),
				  getDoubleParam( PARAM_BORDER ) );
	    break;

	 default:
	    break;
      }

      return( image );
   }

   private RenderedImage render( Area inside, Area outside, double dWidth, double dHeight )
   {
      BufferedImage image = new BufferedImage( m_CanvasSize.x, m_CanvasSize.y, BufferedImage.TYPE_INT_RGB );
      Graphics2D g = image.createGraphics();

      //  Give VM some hints on how we want things to render.
      g.setRenderingHint( RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON );
      g.setRenderingHint( RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_NORMALIZE );
      g.setRenderingHint( RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON );

      //  Clear the image so we have an empty canvas on which to draw.
      g.setColor( Color.white );
      g.fillRect( 0, 0, m_CanvasSize.x, m_CanvasSize.y );

      Point origin = new Point( m_CanvasSize.x >> 1, m_CanvasSize.y >> 1 );
      double dScale = scaleToWindow( g, dWidth, dHeight );
      AffineTransform xform = AffineTransform.getTranslateInstance( -dWidth * dScale / 2, -dHeight * dScale / 2 );

      //  The transformation above will center the shapes over the origin.  Now move
      //  the origin to the center of the image and add scaling to the transform so
      //  the outside shape almost touches the edge of the canvas.
      xform.scale( dScale, dScale );

      Shape shape = xform.createTransformedShape( outside );

      //  Draw the outside shape using a thick stroke, filled with a wood-like color.
      g.setColor( new Color( 0x00eeddaa ) );
      g.fill( shape );
      g.setStroke( new BasicStroke( 3 ) );
      g.setColor( Color.black );
      g.draw( shape );

      shape = xform.createTransformedShape( inside );
      Rectangle bounds = shape.getBounds();

      //  Draw the inside shape using a thin stroke, filled with a gray gradient to
      //  simulate mirror glass.
      g.setPaint( new GradientPaint( bounds.x, bounds.y, Color.lightGray,
                                            bounds.x + bounds.width, bounds.y + bounds.height, Color.white ) );
      g.fill( shape );
      g.setStroke( new BasicStroke( 2 ) );
      g.setColor( Color.black );
      g.draw( shape );

      //  Watermark our image for copyright purposes.
      drawWatermark( g );

      g.setTransform( new AffineTransform() );
      drawCopyright( g );

      if( !isBlank( m_sTitle ) )
         drawTitle( g, dScale );

      if( m_bShowKey && 0.0001 < dScale )
         drawKey( g, dScale );

      //  Free our graphics context and return the result.
      g.dispose();
      return( image );
   }

   private double scaleToWindow( Graphics2D g, double dWidth, double dHeight )
   {
      GlyphVector gv = m_Font.createGlyphVector( g.getFontRenderContext(), "1" );
      int height = gv.getPixelBounds( null, 0, 0 ).height;
      int dy = m_CanvasSize.y - height - 10;

      if( !isBlank( m_sTitle ) || m_bShowKey )
         dy -= height + 5;

      if( m_bShowKey )
         dy -= 10;

      g.setTransform( AffineTransform.getTranslateInstance( m_CanvasSize.x / 2.0, dy / 2.0 ) );
      
      return( 0.9 * Math.min( m_CanvasSize.x / dWidth, dy / dHeight ) );
   }

   private void drawWatermark( Graphics2D g )
   {
      GlyphVector gv = m_Font.createGlyphVector( g.getFontRenderContext(), "ZETAMARI.COM" );
      AffineTransform xform = AffineTransform.getRotateInstance( -Math.PI / 12 );
      Shape shape = xform.createTransformedShape( gv.getOutline() );

      Rectangle extent = shape.getBounds();
      double dScale = Math.min( m_CanvasSize.x / extent.width, m_CanvasSize.y / extent.height );

      xform.scale( dScale, dScale );
      shape = xform.createTransformedShape( gv.getOutline() );

      extent = shape.getBounds();
      g.translate( -(extent.width >> 1), extent.height >> 1 );

      g.setComposite( AlphaComposite.getInstance( AlphaComposite.SRC_OVER, 0.4f ) );
      g.setColor( new Color( 0x00eeeeee ) );
      g.fill( shape );

      g.setStroke( new BasicStroke( 2 ) );
      g.setColor( new Color( 0x00cccccc ) );
      g.draw( shape );

      g.setComposite( AlphaComposite.Src );
   }

   private void drawCopyright( Graphics2D g )
   {
      String sCopyright = "Copyright \u00a9 " + Calendar.getInstance().get( Calendar.YEAR ) + " Zetamari Mosaic Artworks";
      Font font = m_Font.deriveFont( 9.0f );
      GlyphVector gv = font.createGlyphVector( g.getFontRenderContext(), sCopyright );
      int y = m_CanvasSize.y - 5;

      g.setColor( Color.black );
      g.drawGlyphVector( gv, 5, y );
      g.translate( 0, y - gv.getPixelBounds( null, 0, 0 ).height - 5 );
   }

   private void drawTitle( Graphics2D g, double dScale )
   {
      GlyphVector gv = m_Font.createGlyphVector( g.getFontRenderContext(), m_sTitle );
      g.drawGlyphVector( gv, 5, 0 );
   }

   private void drawKey( Graphics2D g, double dScale )
   {
      double dLine = m_CanvasSize.x / 3.0;
      double dLimit = dLine / dScale;
      String sUnits = "in";

      if( 180 <= dLimit )
      {
         dLimit = Math.floor( dLimit / 36 );
         dLine = dLimit * 36 * dScale;
         sUnits = "yd";
      }
      else if( 12 <= dLimit )
      {
         dLimit = Math.floor( dLimit / 12 );
         dLine = dLimit * 12 * dScale;
         sUnits = "ft";
      }
      else
      {
         double dPower;

         if( 0.001 > dLimit )
            dPower = 10000.0;
         else if( 0.01 > dLimit )
            dPower = 1000.0;
         else if( 0.1 > dLimit )
            dPower = 100.0;
         else if( 1 > dLimit )
            dPower = 10.0;
         else
            dPower = 1.0;

         dLimit = Math.floor( dPower * dLimit ) / dPower;
         dLine = dLimit * dScale;
      }

      GlyphVector gv = m_Font.createGlyphVector( g.getFontRenderContext(), "0" );
      Rectangle extent = gv.getPixelBounds( null, 0, 0 );

      int sx = m_CanvasSize.x - (extent.width >> 1) - 5;
      int sy = 0;

      g.drawGlyphVector( gv, sx - (extent.width >> 1), sy );
      sx -= (int)dLine;

      String sKey = String.valueOf( dLimit ) + " " + sUnits;

      gv = m_Font.createGlyphVector( g.getFontRenderContext(), sKey );
      extent = gv.getPixelBounds( null, 0, 0 );
      g.drawGlyphVector( gv, sx - (extent.width >> 1), sy );

      sy -= extent.height + 5;

      g.drawLine( sx, sy, sx + (int)dLine, sy );
      g.drawLine( sx, sy - 2, sx, sy + 2 );
      g.drawLine( sx + (int)dLine, sy - 2, sx + (int)dLine, sy + 2 );
   }

   private RenderedImage renderCathedral( double dWidth, double dHeight, double dBorder, double dBase )
   {
      double dInsideWidth = dWidth - 2*dBorder;
      double dRadius = dWidth / 2;

      Area inside = new Area( new Arc2D.Double( dBorder, dBorder, dInsideWidth, dInsideWidth, -1, 182, Arc2D.CHORD ) );
      Area outside = new Area( new Arc2D.Double( 0, 0, dWidth, dWidth, -1, 182, Arc2D.CHORD ) );
      
      inside.add( new Area( new Rectangle2D.Double( dBorder, dRadius, dInsideWidth, dHeight - dBase - dRadius ) ) );
      outside.add( new Area( new Rectangle2D.Double( 0, dRadius, dWidth, dHeight - dRadius ) ) );

      return( render( inside, outside, dWidth, dHeight ) );
   }

   private RenderedImage renderEllipse( double dOutsideWidth, double dOutsideHeight,
                                        double dInsideWidth,  double dInsideHeight )
   {
      double dBorderW = (dOutsideWidth - dInsideWidth) / 2;
      double dBorderH = (dOutsideHeight - dInsideHeight) / 2;

      Area inside = new Area( new Ellipse2D.Double( dBorderW, dBorderH, dInsideWidth, dInsideHeight ) );
      Area outside = new Area( new Ellipse2D.Double( 0, 0, dOutsideWidth, dOutsideHeight ) );

      return( render( inside, outside, dOutsideWidth, dOutsideHeight ) );
   }

   private RenderedImage renderRectangle( double dWidth, double dHeight, double dBorder )
   {
      Area inside = new Area( new Rectangle2D.Double( dBorder, dBorder, dWidth - 2*dBorder, dHeight - 2*dBorder ) );
      Area outside = new Area( new Rectangle2D.Double( 0, 0, dWidth, dHeight ) );

      return( render( inside, outside, dWidth, dHeight ) );
   }

   private RenderedImage renderVesica( double dWidth, double dBorder )
   {
      double dHeight = dWidth * Math.sqrt( 3 );
      double dAdjust = dHeight / 2 - dWidth;
      double dRadius = 2 * (dWidth - dBorder);

      Area inside = new Area( new Ellipse2D.Double( dBorder - dWidth, dAdjust + dBorder, dRadius, dRadius ) );
      Area outside = new Area( new Ellipse2D.Double( -dWidth, dAdjust, 2*dWidth, 2*dWidth ) );

      inside.intersect( new Area( new Ellipse2D.Double( dBorder, dAdjust + dBorder, dRadius, dRadius ) ) );      
      outside.intersect( new Area( new Ellipse2D.Double( 0, dAdjust, 2*dWidth, 2*dWidth ) ) );
      
      return( render( inside, outside, dWidth, dHeight ) );
   }

    boolean getBooleanParam( String name, boolean def )
    {
	String value = m_Params.get( name );
	return( isBlank( value ) ? def : Boolean.parseBoolean( value ) || 0 != Integer.parseInt( value ) );
    }

    double getDoubleParam( String name, double def )
    {
	String value = m_Params.get( name );
	return( isBlank( value ) ? def : Double.parseDouble( value ) );
    }

    int getIntParam( String name, int def )
    {
	String value = m_Params.get( name );
	return( isBlank( value ) ? def : Integer.parseInt( value ) );
    }

    String getStringParam( String name, String def )
    {
	String value = m_Params.get( name );
	return( isBlank( value ) ? def : value );
    }

    boolean getBooleanParam( String name ) { return getBooleanParam( name, false ); }
    double  getDoubleParam( String name ) { return getDoubleParam( name, 0.0 ); }
    int     getIntParam( String name )    { return getIntParam( name, 0 ); }
    String  getStringParam( String name ) { return getStringParam( name, "" ); }

    boolean isBlank( String value ) { return null == value || 0 == value.length(); }
}
