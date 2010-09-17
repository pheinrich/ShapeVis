// ------------------------------------------------------------------------------------------------
//
//  Zetamari
//
//  Copyright (c) 2004  Peter Heinrich
//  All Rights Reserved
//
//  $Id:$
//  $Revision:$
//
// ------------------------------------------------------------------------------------------------
//  $Author:$
//  $DateTime:$
// ------------------------------------------------------------------------------------------------



package com.zetamari.calc;



import java.awt.BasicStroke;
import java.awt.Color;
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

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.saphum.util.JspHelper;
   


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
public class ModelShape
   extends HttpServlet
{
   public static final int CATHEDRAL = 1;
   public static final int CATHEDRAL2 = 2;
   public static final int CIRCLE = 3;
   public static final int ELLIPSE = 4;
   public static final int RECTANGLE = 5;
   public static final int SQUARE = 6;
   public static final int VESICA = 7;

   public static final int DEFAULT_CANVAS_WIDTH  = 300;
   public static final int DEFAULT_CANVAS_HEIGHT = 300;

   private Point m_CanvasSize;


   
   /**
    *  Returns a JPEG image we generate on-the-fly representing a particular shape
    *  with a specific set of dimensions.
    *
    *  @param request a <code>HttpServletRequest</code> describing the shape we should render
    *  @param response the <code>HttpServletResponse</code> where we'll be sending our image
    */
   public void doGet( HttpServletRequest request, HttpServletResponse response )
      throws IOException, ServletException
   {
      RenderedImage image = null;

      //  Retrieve the target size, if provided.
      m_CanvasSize = new Point( JspHelper.getIntParam( request, "cw", DEFAULT_CANVAS_WIDTH ),
                                JspHelper.getIntParam( request, "ch", DEFAULT_CANVAS_HEIGHT ) );

      //  Draw the shape requested.
      switch( JspHelper.getIntParam( request, "shape" ) )
      {
         case CATHEDRAL:
         case CATHEDRAL2:
         {
            double dBorder = JspHelper.getDoubleParam( request, "b" );
            
            image = renderCathedral( JspHelper.getDoubleParam( request, "w" ),
                                     JspHelper.getDoubleParam( request, "h" ),
                                     dBorder,
                                     JspHelper.getDoubleParam( request, "a", dBorder ) );
            break;
         }

         case CIRCLE:
         case ELLIPSE:
         {
            double dOutsideWidth = JspHelper.getDoubleParam( request, "ow" );
            double dInsideWidth  = JspHelper.getDoubleParam( request, "iw" );

            image = renderEllipse( dOutsideWidth,
                                   JspHelper.getDoubleParam( request, "oh", dOutsideWidth ),
                                   dInsideWidth,
                                   JspHelper.getDoubleParam( request, "ih", dInsideWidth ) );
            break;
         }

         case RECTANGLE:
         case SQUARE:
         {
            double dWidth = JspHelper.getDoubleParam( request, "w" );

            image = renderRectangle( dWidth,
                                     JspHelper.getDoubleParam( request, "h", dWidth ),
                                     JspHelper.getDoubleParam( request, "b" ) );
            break;
         }

         case VESICA:
            image = renderVesica( JspHelper.getDoubleParam( request, "w" ),
                                  JspHelper.getDoubleParam( request, "b" ) );
            break;

         default:
            break;
      }

      if( null != image )
      {
         response.setContentType( "image/jpeg" );
         ImageIO.write( image, "jpg", response.getOutputStream() );
      }
      else
      {
         response.setContentType( "text/html" );
         response.getWriter().println( "Error creating image<br/>" );
      }
   }

   private RenderedImage render( Area inside, Area outside, double dWidth, double dHeight )
   {
      BufferedImage image = new BufferedImage( m_CanvasSize.x, m_CanvasSize.y, BufferedImage.TYPE_INT_RGB );
      Graphics2D graphics = image.createGraphics();

      //  Tell the VM to antialias our drawing, if possible.
      graphics.setRenderingHint( RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON );

      //  Clear the image so we have an empty canvas on which to draw.
      graphics.setColor( Color.white );
      graphics.fillRect( 0, 0, m_CanvasSize.x, m_CanvasSize.y );

      double dScale = 0.9 * Math.min( m_CanvasSize.x / dWidth, m_CanvasSize.y / dHeight );
      AffineTransform xform = AffineTransform.getTranslateInstance( -dWidth * dScale / 2, -dHeight * dScale / 2 );

      //  The transformation above will center the shapes over the origin.  Now move
      //  the origin to the center of the image and add scaling to the transform so
      //  the outside shape almost touches the edge of the canvas.
      graphics.translate( m_CanvasSize.x / 2, m_CanvasSize.y / 2 );
      xform.scale( dScale, dScale );

      Shape shape = xform.createTransformedShape( outside );

      //  Draw the outside shape using a thick stroke, filled with a wood-like color.
      graphics.setColor( new Color( 0x00eeddaa ) );
      graphics.fill( shape );
      graphics.setStroke( new BasicStroke( 3 ) );
      graphics.setColor( Color.black );
      graphics.draw( shape );

      shape = xform.createTransformedShape( inside );
      Rectangle bounds = shape.getBounds();

      //  Draw the inside shape using a thin stroke, filled with a gray gradient to
      //  simulate mirror glass.
      graphics.setPaint( new GradientPaint( bounds.x, bounds.y, Color.lightGray,
                                            bounds.x + bounds.width, bounds.y + bounds.height, Color.white ) );
      graphics.fill( shape );
      graphics.setStroke( new BasicStroke( 2 ) );
      graphics.setColor( Color.black );
      graphics.draw( shape );

      //  Free our graphics context and return the result.
      graphics.dispose();
      return( image );
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
}
