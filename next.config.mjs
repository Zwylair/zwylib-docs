import nextra from 'nextra'
 
// Set up Nextra with its configuration
const withNextra = nextra({
  search: false,
  // ... Add Nextra-specific options here
})
 
// Export the final Next.js config with Nextra included
export default withNextra({
  turbopack: {
    resolveAlias: {
      // Path to your `mdx-components` file with extension
      'next-mdx-import-source-file': './mdx-components.jsx'
    }
  }
})