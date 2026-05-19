export const calculatePriorityScore = (planType: string, featured: boolean): number => {
  let score = 0;
  
  // Rule: Priority listings must ALWAYS remain above non-priority listings
  if (featured) {
    score += 1000;
  }
  
  // Respect subscription hierarchy within Priority and Normal groups
  if (planType === 'PRO') {
    score += 300;
  } else if (planType === 'PREMIUM') {
    score += 200;
  } else {
    score += 100;
  }
  
  return score;
};
