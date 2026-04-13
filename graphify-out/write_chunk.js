import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = {
  nodes: [
    {id:"vitest_config",label:"Vitest Config",file_type:"code",source_file:"vitest.config.ts",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"app_app",label:"App Root Component",file_type:"code",source_file:"src/App.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_activelog",label:"ActiveLogger Component",file_type:"code",source_file:"src/components/ActiveLogger.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_bottomnav",label:"BottomNav Component",file_type:"code",source_file:"src/components/BottomNav.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_calibratebaselines",label:"CalibrateBaselinesCard Component",file_type:"code",source_file:"src/components/CalibrateBaselinesCard.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_coreignition",label:"CoreIgnition Boot Screen",file_type:"code",source_file:"src/components/CoreIgnition.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_draftblueprintreview",label:"DraftBlueprintReview Gantry",file_type:"code",source_file:"src/components/DraftBlueprintReview.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_exercisecard",label:"ExerciseCard Component",file_type:"code",source_file:"src/components/ExerciseCard.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_featurepulse",label:"FeaturePulse Tooltip Component",file_type:"code",source_file:"src/components/FeaturePulse.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_functionalwhy",label:"FunctionalWhy Educational Panel",file_type:"code",source_file:"src/components/FunctionalWhy.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_identitysplash",label:"IdentitySplash Onboarding Form",file_type:"code",source_file:"src/components/IdentitySplash.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_onboardinghero",label:"OnboardingHero Component",file_type:"code",source_file:"src/components/OnboardingHero.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_sessionblueprint",label:"SessionBlueprint Drafting Lab",file_type:"code",source_file:"src/components/SessionBlueprint.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"components_thinkingterminal",label:"ThinkingTerminal Architect Engine",file_type:"code",source_file:"src/components/ThinkingTerminal.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"data_functionalmapping",label:"Functional Mapping Data",file_type:"code",source_file:"src/data/functionalMapping.ts",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"db_schema",label:"IronProtocolDB Schema and Types",file_type:"code",source_file:"src/db/schema.ts",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"db_seedexercises",label:"Exercise Library Seed Data",file_type:"code",source_file:"src/db/seedExercises.ts",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"pages_homepage",label:"HomePage Phase Router",file_type:"code",source_file:"src/pages/HomePage.tsx",source_location:null,source_url:null,captured_at:null,author:null,contributor:null},
    {id:"schema_ironprotocoldb",label:"IronProtocolDB Dexie Class",file_type:"code",source_file:"src/db/schema.ts",source_location:"class IronProtocolDB",source_url:null,captured_at:null,author:null,contributor:null},
    {id:"schema_tempsession",label:"TempSession Interface",file_type:"code",source_file:"src/db/schema.ts",source_location:"interface TempSession",source_url:null,captured_at:null,author:null,contributor:null},
    {id:"schema_appsettings",label:"AppSettings Interface",file_type:"code",source_file:"src/db/schema.ts",source_location:"interface AppSettings",source_url:null,captured_at:null,author:null,contributor:null},
    {id:"schema_exercise",label:"Exercise Interface",file_type:"code",source_file:"src/db/schema.ts",source_location:"interface Exercise",source_url:null,captured_at:null,author:null,contributor:null},
    {id:"schema_personalbestservice",label:"PersonalBestsService",file_type:"code",source_file:"src/services/personalBestsService.ts",source_location:null,source_url:null,captured_at:null,author:null,contributor:null}
  ],
  edges: [
    {source:"app_app",target:"components_coreignition",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/App.tsx",source_location:"line 80",weight:1.0},
    {source:"app_app",target:"components_bottomnav",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/App.tsx",source_location:"line 88",weight:1.0},
    {source:"app_app",target:"components_calibratebaselines",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/App.tsx",source_location:"line 66",weight:1.0},
    {source:"app_app",target:"pages_homepage",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/App.tsx",source_location:"line 72",weight:1.0},
    {source:"app_app",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/App.tsx",source_location:"line 7",weight:1.0},
    {source:"components_activelog",target:"components_featurepulse",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/ActiveLogger.tsx",source_location:"line 393",weight:1.0},
    {source:"components_activelog",target:"components_functionalwhy",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/ActiveLogger.tsx",source_location:"line 367",weight:1.0},
    {source:"components_activelog",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/ActiveLogger.tsx",source_location:"lines 8-11",weight:1.0},
    {source:"components_activelog",target:"schema_tempsession",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/ActiveLogger.tsx",source_location:"line 9",weight:1.0},
    {source:"components_activelog",target:"schema_personalbestservice",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/ActiveLogger.tsx",source_location:"line 63",weight:1.0},
    {source:"components_activelog",target:"schema_ironprotocoldb",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/ActiveLogger.tsx",source_location:"line 19",weight:1.0},
    {source:"components_calibratebaselines",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/CalibrateBaselinesCard.tsx",source_location:"line 3",weight:1.0},
    {source:"components_calibratebaselines",target:"schema_ironprotocoldb",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/CalibrateBaselinesCard.tsx",source_location:"line 64",weight:1.0},
    {source:"components_functionalwhy",target:"data_functionalmapping",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/FunctionalWhy.tsx",source_location:"line 3",weight:1.0},
    {source:"components_identitysplash",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/IdentitySplash.tsx",source_location:"line 3",weight:1.0},
    {source:"components_identitysplash",target:"schema_appsettings",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/IdentitySplash.tsx",source_location:"lines 63-76",weight:1.0},
    {source:"components_onboardinghero",target:"components_featurepulse",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/OnboardingHero.tsx",source_location:"line 123",weight:1.0},
    {source:"components_sessionblueprint",target:"data_functionalmapping",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/SessionBlueprint.tsx",source_location:"line 13",weight:1.0},
    {source:"components_sessionblueprint",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/SessionBlueprint.tsx",source_location:"lines 11-12",weight:1.0},
    {source:"components_sessionblueprint",target:"schema_ironprotocoldb",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/components/SessionBlueprint.tsx",source_location:"line 18",weight:1.0},
    {source:"pages_homepage",target:"components_activelog",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 379",weight:1.0},
    {source:"pages_homepage",target:"components_draftblueprintreview",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 352",weight:1.0},
    {source:"pages_homepage",target:"components_sessionblueprint",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 501",weight:1.0},
    {source:"pages_homepage",target:"components_thinkingterminal",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 414",weight:1.0},
    {source:"pages_homepage",target:"components_identitysplash",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 403",weight:1.0},
    {source:"pages_homepage",target:"components_onboardinghero",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 472",weight:1.0},
    {source:"pages_homepage",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"lines 16-20",weight:1.0},
    {source:"pages_homepage",target:"db_seedexercises",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 284",weight:1.0},
    {source:"pages_homepage",target:"schema_ironprotocoldb",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"line 81",weight:1.0},
    {source:"pages_homepage",target:"schema_tempsession",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"lines 108-123",weight:1.0},
    {source:"pages_homepage",target:"schema_appsettings",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/pages/HomePage.tsx",source_location:"lines 103-106",weight:1.0},
    {source:"db_seedexercises",target:"db_schema",relation:"references",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/db/seedExercises.ts",source_location:"line 2",weight:1.0},
    {source:"db_seedexercises",target:"schema_ironprotocoldb",relation:"calls",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/db/seedExercises.ts",source_location:"line 79",weight:1.0},
    {source:"db_seedexercises",target:"schema_exercise",relation:"shares_data_with",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/db/seedExercises.ts",source_location:"line 4",weight:1.0},
    {source:"components_coreignition",target:"components_thinkingterminal",relation:"semantically_similar_to",confidence:"INFERRED",confidence_score:0.8,source_file:"src/components/CoreIgnition.tsx",source_location:null,weight:0.8},
    {source:"components_sessionblueprint",target:"components_draftblueprintreview",relation:"conceptually_related_to",confidence:"INFERRED",confidence_score:0.9,source_file:"src/components/SessionBlueprint.tsx",source_location:null,weight:0.9},
    {source:"data_functionalmapping",target:"schema_exercise",relation:"conceptually_related_to",confidence:"INFERRED",confidence_score:0.85,source_file:"src/data/functionalMapping.ts",source_location:null,weight:0.85},
    {source:"components_activelog",target:"components_sessionblueprint",relation:"conceptually_related_to",confidence:"INFERRED",confidence_score:0.8,source_file:"src/components/ActiveLogger.tsx",source_location:null,weight:0.8},
    {source:"components_identitysplash",target:"components_onboardinghero",relation:"semantically_similar_to",confidence:"INFERRED",confidence_score:0.75,source_file:"src/components/IdentitySplash.tsx",source_location:null,weight:0.75},
    {source:"schema_ironprotocoldb",target:"db_schema",relation:"implements",confidence:"EXTRACTED",confidence_score:1.0,source_file:"src/db/schema.ts",source_location:"class IronProtocolDB extends Dexie",weight:1.0},
    {source:"pages_homepage",target:"components_sessionblueprint",relation:"rationale_for",confidence:"INFERRED",confidence_score:0.85,source_file:"src/pages/HomePage.tsx",source_location:"SessionPhase idle routing",weight:0.85}
  ],
  hyperedges: [
    {id:"session_flow_pipeline",label:"Session Flow Pipeline: Blueprint to Review to Ignition to Logger",nodes:["components_sessionblueprint","components_draftblueprintreview","components_activelog"],relation:"participate_in",confidence:"EXTRACTED",confidence_score:0.95,source_file:"src/pages/HomePage.tsx"},
    {id:"onboarding_gate_sequence",label:"Onboarding Gate Sequence: IdentitySplash to OnboardingHero to ThinkingTerminal",nodes:["components_identitysplash","components_onboardinghero","components_thinkingterminal"],relation:"participate_in",confidence:"INFERRED",confidence_score:0.85,source_file:"src/pages/HomePage.tsx"},
    {id:"exercise_data_triad",label:"Exercise Data Triad: Schema plus Seed plus FunctionalMapping",nodes:["schema_exercise","db_seedexercises","data_functionalmapping"],relation:"form",confidence:"INFERRED",confidence_score:0.8,source_file:"src/db/seedExercises.ts"}
  ],
  input_tokens: 0,
  output_tokens: 0
};

const outPath = path.join(__dirname, '.graphify_chunk_01.json');
fs.writeFileSync(outPath, JSON.stringify(data), 'utf8');
console.log('written', fs.statSync(outPath).size, 'bytes to', outPath);
