const fs=require('fs');
const code=fs.readFileSync('apps-script/orchestrator/Phase1FinalOrchestrator_v5.gs','utf8');
global.Logger={log:function(){}};
eval(code);
testFctPhase1ApprovalNormalizationNoApi();
console.log('PHASE1_V5_APPROVAL_SUITE_PASS');
