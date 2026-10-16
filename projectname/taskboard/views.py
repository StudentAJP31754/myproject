import json

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import Task


@ensure_csrf_cookie
def index(request):
    return render(request, 'taskboard/index.html')


def parse_json(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


@require_http_methods(['GET', 'POST'])
def task_list(request):
    if request.method == 'GET':
        tasks = [task.to_dict() for task in Task.objects.all()]
        return JsonResponse(tasks, safe=False)

    data = parse_json(request)
    if data is None:
        return JsonResponse({'error': 'Niepoprawny JSON.'}, status=400)

    title = data.get('title')
    if not isinstance(title, str) or not title.strip():
        return JsonResponse({'error': 'Treść zadania nie może być pusta.'}, status=400)
    title = title.strip()
    if len(title) > 200:
        return JsonResponse({'error': 'Treść zadania może mieć maksymalnie 200 znaków.'}, status=400)

    task = Task.objects.create(title=title)
    return JsonResponse(task.to_dict(), status=201)


@require_http_methods(['PATCH', 'DELETE'])
def task_detail(request, task_id):
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        return JsonResponse({'error': 'Zadanie nie istnieje.'}, status=404)

    if request.method == 'DELETE':
        task.delete()
        return HttpResponse(status=204)

    data = parse_json(request)
    if data is None or not isinstance(data.get('completed'), bool):
        return JsonResponse({'error': 'Pole "completed" musi mieć wartość true lub false.'}, status=400)

    task.completed = data['completed']
    task.save()
    return JsonResponse(task.to_dict())
