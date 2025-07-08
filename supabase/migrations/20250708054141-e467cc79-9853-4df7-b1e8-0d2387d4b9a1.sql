-- Call admin function to create super admin
SELECT functions.invoke('admin-create-user', '{
  "email": "homerf@spellshield.com.au",
  "password": "9tZHY!ChXD5X7^b6eMPh",
  "firstName": "Homer",
  "lastName": "F",
  "role": "super_admin"
}'::json);