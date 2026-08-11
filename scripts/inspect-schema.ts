import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log("Inspecting research_topics...");
  const { data: topics, error: topicsError } = await supabase
    .from("research_topics")
    .select("*")
    .limit(1);
  if (topicsError) console.error("Topics Error:", topicsError);
  else console.log("Topics Row Structure:", topics && topics[0] ? Object.keys(topics[0]) : "No rows found, but query succeeded.");

  console.log("\nInspecting research_references...");
  const { data: refs, error: refsError } = await supabase
    .from("research_references")
    .select("*")
    .limit(1);
  if (refsError) console.error("References Error:", refsError);
  else console.log("References Row Structure:", refs && refs[0] ? Object.keys(refs[0]) : "No rows found, but query succeeded.");
}

inspectSchema();
