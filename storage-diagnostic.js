/**
 * STORAGE DIAGNOSTIC TOOL
 * 
 * Run this in your browser console to diagnose storage issues
 * Copy and paste this entire code block into the console
 */

(async function diagnoseStorage() {
  console.log('🔍 DRIPMAP STORAGE DIAGNOSTIC TOOL\n');
  console.log('='.repeat(50));
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Environment Variables
  console.log('\n1️⃣ Checking Environment Variables...');
  try {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      console.log(`   ✅ VITE_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
      console.log(`   ✅ VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 30)}...`);
      results.passed.push('Environment variables configured');
    } else {
      console.error('   ❌ Missing environment variables');
      results.failed.push('Environment variables missing');
    }
  } catch (e) {
    console.error('   ❌ Cannot access environment variables');
    results.failed.push('Environment access error');
  }

  // Test 2: Authentication
  console.log('\n2️⃣ Checking Authentication...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('   ❌ Auth error:', error.message);
      results.failed.push('Authentication error');
    } else if (session?.user) {
      console.log(`   ✅ Authenticated as: ${session.user.email}`);
      console.log(`   ✅ User ID: ${session.user.id}`);
      results.passed.push('User authenticated');
    } else {
      console.warn('   ⚠️  Not logged in');
      results.warnings.push('No active session - login required for uploads');
    }
  } catch (e) {
    console.error('   ❌ Auth check failed:', e);
    results.failed.push('Auth check failed');
  }

  // Test 3: Storage Buckets
  console.log('\n3️⃣ Checking Storage Buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('   ❌ Cannot list buckets:', error.message);
      results.failed.push('Cannot access storage');
    } else {
      console.log(`   ✅ Found ${buckets.length} bucket(s)`);
      buckets.forEach(b => console.log(`      - ${b.name} (${b.public ? 'public' : 'private'})`));
      
      const shopImagesBucket = buckets.find(b => b.name === 'shop-images');
      if (shopImagesBucket) {
        console.log(`   ✅ "shop-images" bucket exists (${shopImagesBucket.public ? 'public' : 'private'})`);
        results.passed.push('shop-images bucket exists');
      } else {
        console.error('   ❌ "shop-images" bucket NOT FOUND');
        results.failed.push('shop-images bucket missing - RUN STORAGE_FIX.sql');
      }
    }
  } catch (e) {
    console.error('   ❌ Storage check failed:', e);
    results.failed.push('Storage check failed');
  }

  // Test 4: Storage Upload Permission (if authenticated)
  console.log('\n4️⃣ Testing Upload Permission...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('   ⚠️  Skipped (not logged in)');
      results.warnings.push('Cannot test upload without login');
    } else {
      // Try to upload a tiny test file
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `test/${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('shop-images')
        .upload(testFileName, testFile);
      
      if (error) {
        console.error('   ❌ Upload test failed:', error.message);
        
        if (error.message.includes('policy')) {
          results.failed.push('RLS policy blocking uploads - RUN STORAGE_FIX.sql');
        } else if (error.message.includes('not found')) {
          results.failed.push('Bucket not found - RUN STORAGE_FIX.sql');
        } else {
          results.failed.push(`Upload failed: ${error.message}`);
        }
      } else {
        console.log('   ✅ Upload permission OK');
        results.passed.push('Upload test successful');
        
        // Clean up test file
        await supabase.storage.from('shop-images').remove([testFileName]);
        console.log('   ✅ Cleanup successful');
      }
    }
  } catch (e) {
    console.error('   ❌ Upload test error:', e);
    results.failed.push('Upload test error');
  }

  // Final Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC RESULTS\n');
  
  if (results.passed.length > 0) {
    console.log(`✅ PASSED (${results.passed.length}):`);
    results.passed.forEach(p => console.log(`   • ${p}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(w => console.log(`   • ${w}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED (${results.failed.length}):`);
    results.failed.forEach(f => console.log(`   • ${f}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (results.failed.length === 0) {
    console.log('🎉 ALL CHECKS PASSED! Storage should work.');
  } else {
    console.log('⚠️  ACTION REQUIRED:');
    console.log('   1. Run STORAGE_FIX.sql in Supabase SQL Editor');
    console.log('   2. Refresh the page');
    console.log('   3. Run this diagnostic again');
  }
  
  return {
    passed: results.passed,
    warnings: results.warnings,
    failed: results.failed,
    status: results.failed.length === 0 ? 'READY' : 'NEEDS_FIX'
  };
})();
