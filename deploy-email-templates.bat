@echo off
set SUPABASE_ACCESS_TOKEN=sbp_510fcb518af304009792c083d3ff497013a0b3fa
cd /d "C:\Users\ragid\OneDrive\000 2025\Apps Dev\Apps2\career-playbook"
echo Deploying manage-email-templates function...
npx supabase functions deploy manage-email-templates --project-ref rdufwjhptmlpmjmcibpn
echo Setting SUPABASE_ACCESS_TOKEN secret...
npx supabase secrets set SUPABASE_ACCESS_TOKEN=sbp_510fcb518af304009792c083d3ff497013a0b3fa --project-ref rdufwjhptmlpmjmcibpn
echo Done!
