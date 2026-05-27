from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer


class CustomerModelTest(TestCase):

    def _make_customer(self, **kwargs):
        defaults = {
            'name': 'Acme Corp',
            'customer_type': Customer.COMPANY,
            'email': 'acme@example.com',
        }
        defaults.update(kwargs)
        return Customer.objects.create(**defaults)

    # --- __str__ ---

    def test_str_returns_name(self):
        customer = self._make_customer(name='TechPerú S.A.C.')
        self.assertEqual(str(customer), 'TechPerú S.A.C.')

    # --- Choices ---

    def test_choices_company_value(self):
        self.assertEqual(Customer.COMPANY, 'company')

    def test_choices_individual_value(self):
        self.assertEqual(Customer.INDIVIDUAL, 'individual')

    def test_choices_contains_exactly_two_options(self):
        values = [v for v, _ in Customer.CUSTOMER_TYPE_CHOICES]
        self.assertIn('company', values)
        self.assertIn('individual', values)
        self.assertEqual(len(values), 2)

    # --- is_active default ---

    def test_is_active_defaults_to_true(self):
        customer = self._make_customer()
        self.assertTrue(customer.is_active)

    # --- Timestamps automáticos ---

    def test_created_at_set_on_creation(self):
        customer = self._make_customer()
        self.assertIsNotNone(customer.created_at)

    def test_updated_at_set_on_creation(self):
        customer = self._make_customer()
        self.assertIsNotNone(customer.updated_at)

    def test_updated_at_changes_on_save(self):
        customer = self._make_customer()
        original_updated_at = customer.updated_at
        customer.name = 'Updated Name'
        customer.save()
        self.assertGreaterEqual(customer.updated_at, original_updated_at)

    # --- Campos nullable ---

    def test_tax_id_accepts_null(self):
        customer = self._make_customer(tax_id=None)
        self.assertIsNone(customer.tax_id)

    def test_phone_accepts_null(self):
        customer = self._make_customer(phone=None)
        self.assertIsNone(customer.phone)

    def test_address_accepts_null(self):
        customer = self._make_customer(address=None)
        self.assertIsNone(customer.address)

    # --- Unicidad de email ---

    def test_email_must_be_unique(self):
        self._make_customer(email='unique@example.com')
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Otro Cliente',
                customer_type=Customer.INDIVIDUAL,
                email='unique@example.com',
            )

    # --- Unicidad de tax_id ---

    def test_tax_id_must_be_unique_when_set(self):
        self._make_customer(tax_id='12345678901', email='first@example.com')
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Segundo Cliente',
                customer_type=Customer.COMPANY,
                email='second@example.com',
                tax_id='12345678901',
            )

    def test_multiple_null_tax_ids_are_allowed(self):
        self._make_customer(tax_id=None, email='first@example.com')
        customer2 = Customer.objects.create(
            name='Segundo Cliente',
            customer_type=Customer.INDIVIDUAL,
            email='second@example.com',
            tax_id=None,
        )
        self.assertIsNone(customer2.tax_id)

    # --- Campos requeridos ---

    def test_create_without_name_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name=None,
                customer_type=Customer.COMPANY,
                email='noname@example.com',
            )

    def test_create_without_email_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Sin Email',
                customer_type=Customer.COMPANY,
                email=None,
            )

    # --- Ordering por defecto ---

    def test_default_ordering_is_by_name(self):
        Customer.objects.create(name='Zorro Inc', customer_type=Customer.COMPANY, email='z@example.com')
        Customer.objects.create(name='Alpha Corp', customer_type=Customer.INDIVIDUAL, email='a@example.com')
        customers = list(Customer.objects.all())
        self.assertEqual(customers[0].name, 'Alpha Corp')
        self.assertEqual(customers[1].name, 'Zorro Inc')
