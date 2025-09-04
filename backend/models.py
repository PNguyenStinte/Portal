# calendar_app/models.py
from django.db import models
from users.models import User
from employees.models import Employee

class Event(models.Model):
    planned_start_time_utc = models.DateTimeField()
    name = models.CharField(max_length=255)
    job_number = models.CharField(max_length=255)
    visit_number = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=255)
    technician_name = models.CharField(max_length=255)
    department_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    additional_technicians = models.ManyToManyField(Employee, related_name='additional_events', blank=True)
    last_updated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='last_updated_events')
    last_updated_time_utc = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    