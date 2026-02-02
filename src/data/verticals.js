// src/data/verticals.js
// B2B Vertical Industry Data for PrecisionPrices
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

export const verticals = {
  junkRemoval: {
    name: 'Junk Removal',
    badge: 'For Junk Removal Companies',
    headline: 'Stop Guessing. Start Profiting.',
    subheadline: 'Know what to charge before you arrive. Get instant estimates from customer photos so you can avoid wasted trips and maximize your workflow.',

    stats: [
      { value: 'Eliminate', label: 'Wasted trips' },
      { value: 'Maximize', label: 'Your workflow' }
    ],

    videoUrl: '',

    reportType: 'bulk valuation',
    outcome: 'Quote accurately and optimize your pickup schedule.',

    features: [
      {
        icon: '📸',
        title: 'Photo-Based Estimates',
        description: 'Customers text photos before you drive across town. Get instant estimates for furniture, appliances, and more.'
      },
      {
        icon: '💰',
        title: 'Job Optimization',
        description: 'Know the scope of every job before arrival. Avoid sticker shock and customers who don\'t commit.'
      },
      {
        icon: '📊',
        title: 'Quote Recommendations',
        description: 'Get suggested pricing ranges based on job scope. Charge what the job is really worth.'
      },
      {
        icon: '⚡',
        title: 'Fast Reports',
        description: 'Send professional estimates to customers quickly. Win more jobs by responding faster than competitors.'
      },
      {
        icon: '📍',
        title: 'Local Pricing',
        description: 'Pricing tailored to your area, not national averages. Your location, your market.'
      },
      {
        icon: '🔗',
        title: 'Easy Integration',
        description: 'Works alongside your existing scheduling tools. No workflow disruption.'
      }
    ],

    useCases: [
      {
        title: 'Estate Cleanouts',
        description: 'Get accurate estimates for large cleanout jobs before committing your crew.'
      },
      {
        title: 'Garage Cleanouts',
        description: 'Quickly assess job scope from customer photos to plan your day efficiently.'
      },
      {
        title: 'Office Furniture Removal',
        description: 'Estimate commercial jobs accurately with AI-powered analysis.'
      }
    ],

    testimonial: null
  },

  contractors: {
    name: 'Contractors & Remodelers',
    badge: 'For Contractors & Remodelers',
    headline: 'Demo to Dollars.',
    subheadline: 'Get instant project estimates from customer photos. Know what materials you\'ll need and provide accurate quotes before visiting the site.',

    stats: [
      { value: 'Demo to', label: 'Dollars' },
      { value: 'Faster', label: 'Quotes' }
    ],

    videoUrl: '',

    reportType: 'project estimate',
    outcome: 'Give accurate quotes and identify salvage opportunities.',

    features: [
      {
        icon: '🏗️',
        title: 'Pre-Visit Assessment',
        description: 'See what customers want done from photos before going to the site. Save time and provide better quotes.'
      },
      {
        icon: '♻️',
        title: 'Salvage Opportunities',
        description: 'Identify valuable cabinets, fixtures, and materials that can be salvaged or resold.'
      },
      {
        icon: '📋',
        title: 'Material Estimates',
        description: 'Get AI-powered estimates for materials and labor based on project photos.'
      },
      {
        icon: '🎯',
        title: 'Quote Builder',
        description: 'Create professional quotes with labor and materials breakdown.'
      },
      {
        icon: '💼',
        title: 'Client Communication',
        description: 'Share visual estimates with clients. Stand out from competitors with detailed proposals.'
      },
      {
        icon: '📱',
        title: 'Mobile Ready',
        description: 'Works on jobsites. Analyze photos and create quotes from anywhere.'
      }
    ],

    useCases: [
      {
        title: 'Kitchen Remodels',
        description: 'Estimate kitchen projects from customer photos before the site visit.'
      },
      {
        title: 'Bathroom Renovations',
        description: 'Provide accurate bathroom renovation quotes with material breakdowns.'
      },
      {
        title: 'Whole-Home Renovations',
        description: 'Assess large renovation projects and identify salvage potential.'
      }
    ],

    testimonial: null
  },

  insurance: {
    name: 'Insurance Adjusters',
    badge: 'For Insurance Adjusters & Claims Processors',
    headline: 'Faster, More Accurate Assessments.',
    subheadline: 'Get fair market valuations using AI analysis and marketplace data. Build credibility with defensible, data-backed quotes.',

    stats: [
      { value: 'Faster', label: 'Assessments' },
      { value: 'Defensible', label: 'Valuations' }
    ],

    videoUrl: '',

    reportType: 'insurance valuation',
    outcome: 'Close claims with documentation that withstands scrutiny.',

    features: [
      {
        icon: '🔍',
        title: 'Damage Documentation',
        description: 'AI helps catalog items with condition assessment, brand identification, and market value estimates.'
      },
      {
        icon: '⚖️',
        title: 'Defensible Valuations',
        description: 'Prices backed by marketplace data. Include data sources in reports to support your assessments.'
      },
      {
        icon: '📄',
        title: 'Professional Reports',
        description: 'Generate organized inventories formatted for insurance workflows.'
      },
      {
        icon: '🏷️',
        title: 'Brand Detection',
        description: 'AI identifies brands and model numbers when visible in photos.'
      },
      {
        icon: '📊',
        title: 'Current Market Data',
        description: 'Compare actual cash value vs. replacement cost using recent marketplace pricing.'
      },
      {
        icon: '🔐',
        title: 'Secure Platform',
        description: 'Your data is encrypted and protected. Built with security in mind.'
      }
    ],

    useCases: [
      {
        title: 'Total Loss Claims',
        description: 'Create household inventories with market valuations for disaster claims.'
      },
      {
        title: 'Theft & Burglary',
        description: 'Document stolen items with replacement cost estimates.'
      },
      {
        title: 'Water Damage Assessment',
        description: 'Assess damaged property and determine repair vs. replacement costs.'
      }
    ],

    testimonial: null
  },

  retail: {
    name: 'Antique & Retail Sellers',
    badge: 'For Antique Dealers & Resellers',
    headline: 'Sell Smarter. Sell Quicker.',
    subheadline: 'Get instant market valuations for estate sales, thrift finds, and inventory. Price with confidence using AI-powered analysis.',

    stats: [
      { value: 'Sell', label: 'Smarter' },
      { value: 'Price', label: 'With confidence' }
    ],

    videoUrl: '',

    reportType: 'resale pricing',
    outcome: 'Make data-informed pricing decisions for every listing.',

    features: [
      {
        icon: '🏺',
        title: 'Antique Identification',
        description: 'Snap a photo of furniture, ceramics, glassware, or collectibles. AI helps identify era, style, and market demand.'
      },
      {
        icon: '💎',
        title: 'Condition-Adjusted Pricing',
        description: 'Get values based on actual condition. Factor in wear, damage, and completeness.'
      },
      {
        icon: '📈',
        title: 'Market Analysis',
        description: 'See what similar items have sold for on Marketplace, eBay, and other platforms.'
      },
      {
        icon: '✍️',
        title: 'Listing Help',
        description: 'Get suggested titles and descriptions to help your listings get noticed.'
      },
      {
        icon: '🎯',
        title: 'Platform Suggestions',
        description: 'AI recommends where to list based on item type and your location.'
      },
      {
        icon: '📦',
        title: 'Bulk Pricing',
        description: 'Upload multiple photos at once. Great for estate sales and large inventories.'
      }
    ],

    useCases: [
      {
        title: 'Estate Sale Preparation',
        description: 'Price items quickly for estate liquidations with AI-assisted valuations.'
      },
      {
        title: 'Thrift Store Sourcing',
        description: 'Quickly research items in-store to identify potential finds.'
      },
      {
        title: 'Antique Shop Inventory',
        description: 'Keep your pricing current with market-based data.'
      }
    ],

    testimonial: null
  }
};
