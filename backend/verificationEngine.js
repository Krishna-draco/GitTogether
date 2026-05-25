const { hasConflictMarkers, validateJavaScriptSyntax } = require("./utils");

/**
 * Pass 1: Marker Cleansing Check
 * Validates that no Git conflict markers remain in the code
 * @param {string} code - Code to validate
 * @returns {Object} { passed: boolean, errors: string[] }
 */
function markerCleansing(code) {
  const errors = [];
  const markerRegex = /^<{7}|^={7}|^>{7}/m;

  if (markerRegex.test(code)) {
    errors.push(
      "Merge failed: Unresolved conflict markers still exist in the file.",
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    passName: "Marker Cleansing",
  };
}

/**
 * Pass 2: Empty State Check
 * Ensures developers didn't wipe out the workspace to evade the conflict
 * @param {string} code - Code to validate
 * @param {string} baseContent - Original base content
 * @returns {Object} { passed: boolean, errors: string[] }
 */
function emptyStateCheck(code, baseContent) {
  const errors = [];

  // Check if code is empty or just whitespace
  if (!code || code.trim().length === 0) {
    errors.push(
      "Merge failed: Code cannot be empty. Must contain resolved content.",
    );
    return {
      passed: false,
      errors,
      passName: "Empty State Check",
    };
  }

  // Check if code has been stripped of all meaningful content
  const trimmedCode = code.trim();
  const baseLength = baseContent.length;
  const currentLength = trimmedCode.length;

  // If current code is less than 10% of base, flag it
  if (currentLength < baseLength * 0.1 && baseLength > 50) {
    errors.push(
      "Merge failed: Resolved code has lost significant content. Ensure both branches are properly merged.",
    );
  }

  // Check for at least some content lines (not just comments)
  const nonCommentLines = trimmedCode.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*")
    );
  }).length;

  if (nonCommentLines === 0) {
    errors.push(
      "Merge failed: Code contains only comments. Ensure actual code is present.",
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    passName: "Empty State Check",
  };
}

/**
 * Pass 3: Syntax Smoke Test
 * Validates basic JavaScript syntax structure
 * @param {string} code - Code to validate
 * @returns {Object} { passed: boolean, errors: string[] }
 */
function syntaxSmokeTest(code) {
  const errors = [];

  try {
    // Try to validate syntax
    new Function(code);
  } catch (error) {
    errors.push(`Syntax Error: ${error.message}`);
  }

  // Additional bracket balance checks
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(
      `Bracket mismatch: Found ${openBraces} opening braces but ${closeBraces} closing braces.`,
    );
  }

  if (openParens !== closeParens) {
    errors.push(
      `Parenthesis mismatch: Found ${openParens} opening parentheses but ${closeParens} closing parentheses.`,
    );
  }

  if (openBrackets !== closeBrackets) {
    errors.push(
      `Square bracket mismatch: Found ${openBrackets} opening brackets but ${closeBrackets} closing brackets.`,
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    passName: "Syntax Smoke Test",
  };
}

/**
 * Additional: Content Integrity Check
 * Ensures content changes are legitimate and not corrupted
 * @param {string} code - Code to validate
 * @param {Object} versions - { baseContent, alphaContent, betaContent }
 * @returns {Object} { passed: boolean, errors: string[] }
 */
function contentIntegrityCheck(code, versions) {
  const errors = [];

  // Ensure resolved code isn't identical to just one branch (unless conflicts didn't exist)
  const { baseContent, alphaContent, betaContent } = versions;

  // Trim for comparison
  const codeTrimmed = code.trim();
  const alphaTrimmed = alphaContent.trim();
  const betaTrimmed = betaContent.trim();

  // If resolved code is identical to only one branch, it might indicate lazy resolution
  if (codeTrimmed === alphaTrimmed && codeTrimmed !== betaTrimmed) {
    // This is acceptable - could be intentional resolution
  } else if (codeTrimmed === betaTrimmed && codeTrimmed !== alphaTrimmed) {
    // This is acceptable - could be intentional resolution
  }

  // Check for file corruption indicators (unusual character sequences)
  const suspiciousPatterns = [
    /\0/g, // Null bytes
    /\ufffd/g, // Replacement character
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(code)) {
      errors.push(
        "Merge failed: Detected file corruption or invalid characters in resolved code.",
      );
      break;
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    passName: "Content Integrity Check",
  };
}

/**
 * Run complete verification suite
 * @param {string} resolvedCode - Final resolved code
 * @param {Object} versions - { baseContent, alphaContent, betaContent }
 * @returns {Object} { success: boolean, allErrors: string[], passResults: Object[] }
 */
function runCompleteVerification(resolvedCode, versions) {
  const passResults = [];
  const allErrors = [];

  // Pass 1: Marker Cleansing
  const pass1 = markerCleansing(resolvedCode);
  passResults.push(pass1);
  if (!pass1.passed) allErrors.push(...pass1.errors);

  // Pass 2: Empty State Check
  const pass2 = emptyStateCheck(resolvedCode, versions.baseContent);
  passResults.push(pass2);
  if (!pass2.passed) allErrors.push(...pass2.errors);

  // Pass 3: Syntax Smoke Test
  const pass3 = syntaxSmokeTest(resolvedCode);
  passResults.push(pass3);
  if (!pass3.passed) allErrors.push(...pass3.errors);

  // Additional: Content Integrity Check
  const pass4 = contentIntegrityCheck(resolvedCode, versions);
  passResults.push(pass4);
  if (!pass4.passed) allErrors.push(...pass4.errors);

  return {
    success: allErrors.length === 0,
    allErrors,
    passResults,
    passCount: passResults.filter((p) => p.passed).length,
    totalPasses: passResults.length,
  };
}

/**
 * Get verification report summary
 * @param {Object} verificationResult - Result from runCompleteVerification
 * @returns {Object}
 */
function getVerificationSummary(verificationResult) {
  return {
    success: verificationResult.success,
    passedChecks: verificationResult.passCount,
    totalChecks: verificationResult.totalPasses,
    errors: verificationResult.allErrors,
    details: verificationResult.passResults.map((p) => ({
      name: p.passName,
      passed: p.passed,
      errors: p.errors,
    })),
  };
}

module.exports = {
  markerCleansing,
  emptyStateCheck,
  syntaxSmokeTest,
  contentIntegrityCheck,
  runCompleteVerification,
  getVerificationSummary,
};
