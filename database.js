// src/database.js
// ============================================================
// BIZNIS BOSTON — Database Layer
// All Supabase operations in one place.
// The server never touches Supabase directly — always goes here.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// ── Initialize Supabase Client ────────────────────────────
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: { persistSession: false },
  }
);

// ── BUSINESSES ────────────────────────────────────────────

/**
 * Search businesses by category.
 * Premium and spotlight tiers returned first.
 * Returns up to config.directory.maxResultsPerSearch results.
 */
export async function searchBusinesses(category) {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      category,
      subcategory,
      phone,
      whatsapp,
      address,
      neighborhood,
      city,
      description_creole,
      description_english,
      description_french,
      languages_spoken,
      tier,
      is_verified,
      website
    `)
    .ilike('category', `%${category}%`)
    .eq('is_active', true)
    .order('tier', { ascending: false })
    .limit(config.directory.maxResultsPerSearch);

  if (error) {
    console.error('[DB] searchBusinesses error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get a single business by ID.
 */
export async function getBusinessById(id) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[DB] getBusinessById error:', error.message);
    return null;
  }

  return data;
}

// ── USERS ─────────────────────────────────────────────────

/**
 * Create user on first contact or update last_contact on return.
 * Uses anonymous hashed ID — never stores real phone numbers.
 */
export async function upsertUser(anonymousId, preferredLanguage = 'unknown') {
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        anonymous_id:       anonymousId,
        last_contact:       new Date().toISOString(),
        preferred_language: preferredLanguage,
      },
      {
        onConflict:       'anonymous_id',
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error('[DB] upsertUser error:', error.message);
  }
}

/**
 * Increment the search counter for a user.
 */
export async function incrementUserSearches(anonymousId) {
  const { error } = await supabase
    .rpc('increment_searches', { user_anonymous_id: anonymousId });

  if (error) {
    console.error('[DB] incrementUserSearches error:', error.message);
  }
}

/**
 * Mark a user as opted out (STOP command).
 */
export async function optOutUser(anonymousId) {
  const { error } = await supabase
    .from('users')
    .update({ is_opted_in: false })
    .eq('anonymous_id', anonymousId);

  if (error) {
    console.error('[DB] optOutUser error:', error.message);
  }
}

/**
 * Check if a user is opted in before responding.
 */
export async function isUserOptedIn(anonymousId) {
  const { data, error } = await supabase
    .from('users')
    .select('is_opted_in')
    .eq('anonymous_id', anonymousId)
    .single();

  if (error) return true; // Default to opted-in if not found
  return data?.is_opted_in !== false;
}

// ── SEARCHES ──────────────────────────────────────────────

/**
 * Log every search query for analytics.
 * This feeds your digital twin research data pipeline.
 */
export async function logSearch({
  anonymousUserId,
  rawQuery,
  detectedLanguage,
  categoryMatched,
  resultsCount,
  hadResults,
}) {
  const { error } = await supabase
    .from('searches')
    .insert({
      anonymous_user_id: anonymousUserId,
      raw_query:         rawQuery,
      detected_language: detectedLanguage || 'unknown',
      category_matched:  categoryMatched  || null,
      results_count:     resultsCount     || 0,
      had_results:       hadResults        || false,
    });

  if (error) {
    console.error('[DB] logSearch error:', error.message);
  }
}

// ── ZERO RESULTS ──────────────────────────────────────────

/**
 * Log queries that returned no results.
 * Deduplicates and counts — so you see HOW OFTEN each
 * unmet need is searched. Your most valuable research asset.
 */
export async function logZeroResult(anonymousUserId, rawQuery, detectedLanguage) {
  const { error } = await supabase
    .rpc('upsert_zero_result', {
      p_anonymous_user_id: anonymousUserId,
      p_raw_query:         rawQuery.toLowerCase().trim(),
      p_detected_language: detectedLanguage || 'unknown',
    });

  if (error) {
    console.error('[DB] logZeroResult error:', error.message);
  }
}

// ── LEADS ─────────────────────────────────────────────────

/**
 * Log a lead when a user is shown a premium or spotlight business.
 * This is the proof you show businesses when selling paid tiers.
 * "You received 23 leads last month" → they upgrade.
 */
export async function logLeads(businessIds, anonymousUserId, category) {
  if (!businessIds || businessIds.length === 0) return;

  const leads = businessIds.map((businessId) => ({
    business_id:       businessId,
    anonymous_user_id: anonymousUserId,
    category:          category || null,
  }));

  const { error } = await supabase
    .from('leads')
    .insert(leads);

  if (error) {
    console.error('[DB] logLeads error:', error.message);
  }
}

// ── ANALYTICS (for your admin dashboard) ─────────────────

/**
 * Get community needs — top zero-result searches.
 * Call this to see what the community needs most
 * that you don't have listed yet.
 */
export async function getCommunityNeeds(limit = 20) {
  const { data, error } = await supabase
    .from('community_needs')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('[DB] getCommunityNeeds error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get business lead report.
 * Use this when pitching paid upgrades to businesses.
 */
export async function getBusinessLeadReport() {
  const { data, error } = await supabase
    .from('business_lead_report')
    .select('*');

  if (error) {
    console.error('[DB] getBusinessLeadReport error:', error.message);
    return [];
  }

  return data || [];
}

export { supabase };
