exports.seed = function(knex) {
  return knex('vendors').del() // Delete existing entries
    .then(function () {
      return knex('vendors').insert([
        { vendor_name: 'Amazon', contact_name: 'Jeff Bezos', address: 'Seattle, WA', city: 'Seattle', postal_code: '98101', country: 'USA', phone: '1234567890', status: 1 },
        { vendor_name: 'Blinkit', contact_name: 'Gautam', address: 'Mumbai, MH', city: 'Mumbai', postal_code: '400001', country: 'India', phone: '0987654321', status: 1 },
        { vendor_name: 'Swiggy', contact_name: 'Sri', address: 'Bangalore, KA', city: 'Bangalore', postal_code: '560001', country: 'India', phone: '1122334455', status: 1 },
        { vendor_name: 'Zomato', contact_name: 'Deepinder', address: 'Gurgaon, HR', city: 'Gurgaon', postal_code: '122018', country: 'India', phone: '9988776655', status: 1 }
      ]);
    });
};
