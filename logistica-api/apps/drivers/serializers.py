from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Driver

User = get_user_model()


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email']
        extra_kwargs = {
            'id': {'read_only': True},
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
        }


class DriverSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer()

    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password = user_data.pop('password', None)
        if not password:
            raise serializers.ValidationError(
                {'user': {'password': ['Este campo es requerido.']}}
            )
        if 'username' not in user_data:
            raise serializers.ValidationError(
                {'user': {'username': ['Este campo es requerido.']}}
            )
        user = User(**user_data)
        user.set_password(password)
        user.save()
        return Driver.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        password = user_data.pop('password', None)
        for attr, value in user_data.items():
            setattr(user, attr, value)
        if password:
            user.set_password(password)
        user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
