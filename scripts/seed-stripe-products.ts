import { getUncachableStripeClient } from '../server/stripeClient';

async function seedStripeProducts() {
  console.log('Seeding Stripe products...');
  
  const stripe = await getUncachableStripeClient();

  // Check if products already exist by listing and filtering
  const allProducts = await stripe.products.list({ limit: 100, active: true });
  const existingTierProducts = allProducts.data.filter(
    p => p.metadata?.tier === 'basic' || p.metadata?.tier === 'pro'
  );

  if (existingTierProducts.length > 0) {
    console.log('Products already exist. Skipping seed.');
    console.log('Existing products:');
    for (const product of existingTierProducts) {
      console.log(`  - ${product.name} (${product.id}) - tier: ${product.metadata?.tier}`);
    }
    return;
  }

  // Create Basic tier product
  console.log('Creating Basic tier product...');
  const basicProduct = await stripe.products.create({
    name: 'DriverPath Basic',
    description: 'Essential tools for patient education. Includes content library, content concierge, and internal screenings.',
    metadata: {
      tier: 'basic',
      features: 'content_library,content_concierge,content_packets,internal_screenings,assessment_builder_limited',
    },
  });

  // Create Basic monthly price
  const basicMonthlyPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 1900, // $19.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'basic', billing: 'monthly' },
  });

  // Create Basic annual price (2 months free)
  const basicAnnualPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 19000, // $190.00 (10 months)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'basic', billing: 'annual' },
  });

  console.log(`Created Basic product: ${basicProduct.id}`);
  console.log(`  Monthly price: ${basicMonthlyPrice.id} ($19/mo)`);
  console.log(`  Annual price: ${basicAnnualPrice.id} ($190/yr)`);

  // Create Pro tier product
  console.log('Creating Pro tier product...');
  const proProduct = await stripe.products.create({
    name: 'DriverPath Pro',
    description: 'Full-featured platform for growing practices. Includes everything in Basic plus patient portal, email delivery, care pathways, and follow-up automation.',
    metadata: {
      tier: 'pro',
      features: 'content_library,content_concierge,content_packets,internal_screenings,assessment_builder,patient_portal,email_delivery,care_pathways,follow_up_automation,priority_support',
    },
  });

  // Create Pro monthly price
  const proMonthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'pro', billing: 'monthly' },
  });

  // Create Pro annual price (2 months free)
  const proAnnualPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 29000, // $290.00 (10 months)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'pro', billing: 'annual' },
  });

  console.log(`Created Pro product: ${proProduct.id}`);
  console.log(`  Monthly price: ${proMonthlyPrice.id} ($29/mo)`);
  console.log(`  Annual price: ${proAnnualPrice.id} ($290/yr)`);

  console.log('\nStripe products seeded successfully!');
  console.log('\nTier entitlement summary:');
  console.log('Basic ($19/mo): Content Library, Content Concierge, Content Packets, Internal Screenings, Limited Assessments');
  console.log('Pro ($29/mo): All Basic features + Patient Portal, Email Delivery, Care Pathways, Follow-up Automation, Priority Support');
}

seedStripeProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding products:', error);
    process.exit(1);
  });
