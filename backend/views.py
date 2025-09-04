# calendar_app/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Event
from .serializers import EventSerializer
import pandas as pd
from django.utils.dateparse import parse_datetime

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    @action(detail=False, methods=['post'])
    def upload_excel(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        df = pd.read_excel(file)
        events = []
        for _, row in df.iterrows():
            events.append(Event(
                title=row['title'],
                description=row.get('description', ''),
                start_time=parse_datetime(str(row['start_time'])),
                end_time=parse_datetime(str(row['end_time'])),
                employee_id=row['employee_id'],
                created_by=request.user.id
            ))
        Event.objects.bulk_create(events)
        return Response({"message": "Events uploaded successfully"})
