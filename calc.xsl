<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:import href="../zetamari.xsl"/>



  <!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    -  Establish the output format for our pages.  Make sure the document type
    -  info indicates late-model HTML.
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->
  <xsl:output media-type="text/html"
       disable-output-escaping="true"
       doctype-public="-//W3C//DTD HTML 4.01//EN"
       doctype-system="http://www.w3.org/TR/html4/strict.dtd"/>



  <xsl:variable name="sections">
    <tab href="/gallery/">Gallery</tab>
    <tab href="/courses/">Classes</tab>
    <tab href="/events/">Show Schedule</tab>
    <tab href="/links/">Links</tab>
    <tab href="/company/">About</tab>
    <tab href="/calc/">Calculators</tab>
  </xsl:variable>



  <xsl:template match="canvas">
    <form action="" class="canvas">
      <div>
        <xsl:apply-templates select="description"/>

        <table>
          <tr>
            <td><label for="canvas_width">View Width:</label></td>
            <td>
              <input id="canvas_width" size="8" type="text">
                <xsl:attribute name="value"><xsl:value-of select="width"/></xsl:attribute>
              </input>
            </td>
          </tr>

          <tr>
            <td><label for="canvas_height">View Height:</label></td>
            <td>
              <input id="canvas_height" size="8" type="text">
                <xsl:attribute name="value"><xsl:value-of select="height"/></xsl:attribute>
              </input>
            </td>
          </tr>
        </table>
      </div>
    </form>
  </xsl:template>


  <xsl:template match="calculator">
    <a><xsl:attribute name="name"><xsl:value-of select="@name"/></xsl:attribute></a>
    <h2 class="paratitle"><xsl:value-of select="title"/></h2>
    <div class="calculator">
      <div class="description"><xsl:apply-templates select="description"/></div>

      <table class="form">
        <tr>
          <td style="width: 25%;">
            <img alt="Key">
              <xsl:copy-of select="key/@height | key/@width"/>
              <xsl:attribute name="src">/calc/images/<xsl:value-of select="@name"/>.gif</xsl:attribute>
            </img>
          </td>

          <td style="width: 40%;"><xsl:apply-templates select="form"/></td>

          <td style="width: 35%;">
            <div class="result">
              <xsl:attribute name="id"><xsl:value-of select="@name"/>_result</xsl:attribute>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </xsl:template>



  <xsl:template match="form">
    <form action="">
      <div>
        <xsl:for-each select="field">
          <xsl:variable name="name"><xsl:value-of select="../../@name"/>_<xsl:value-of select="@name"/></xsl:variable>

          <input size="8" type="text"><xsl:attribute name="id"><xsl:value-of select="$name"/></xsl:attribute></input>
          <label>
            <xsl:attribute name="for"><xsl:value-of select="$name"/></xsl:attribute>
            <xsl:attribute name="onDblClick">getObject( '<xsl:value-of select="$name"/>' ).value='';</xsl:attribute>
            <xsl:apply-templates/>
          </label><br/>
        </xsl:for-each>

        <input type="button" value="Calculate">
          <xsl:attribute name="onClick">do<xsl:value-of select="../@name"/>();</xsl:attribute>
        </input>
        <input type="reset" value="Clear"/>
        <input style="visibility: hidden;" type="button" value="View">
          <xsl:attribute name="id"><xsl:value-of select="../@name"/>_view</xsl:attribute>
        </input>
      </div>
    </form>
  </xsl:template>
  


  <!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    -  Generate the sidebar.
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->
  <xsl:template match="sidebar">

    <!--  Build a node set of tabs, one for each section represented.  -->
    <xsl:variable name="tabs">
      <xsl:for-each select="//calculator">
        <tab>
          <xsl:attribute name="href">#<xsl:value-of select="@name"/></xsl:attribute>
          <xsl:value-of select="title"/>
        </tab>
      </xsl:for-each>
    </xsl:variable>

    <!--  Call through to the macro implementation, passing along the tabs we    -->
    <!--  created above.  Note that there must be at least two sections present  -->
    <!--  before sidebar items are displayed, which we accomplish by passing     -->
    <!--  only those tabs that have at least one sibling.                        -->
    <xsl:call-template name="sidebar">
      <xsl:with-param name="tabs" select="$tabs/*[ preceding-sibling::tab or following-sibling::tab ]"/>
    </xsl:call-template>

  </xsl:template>



</xsl:stylesheet>
