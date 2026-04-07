SELECT DISTINCT imp_code, COUNT(*) as nb
FROM depenses
WHERE imp_code ~ '[A-Za-z]'
GROUP BY imp_code
ORDER BY imp_code;
