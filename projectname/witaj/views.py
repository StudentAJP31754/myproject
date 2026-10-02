from django.shortcuts import render
from datetime import datetime
# Create your views here.
from django.http import HttpResponse
def hello(request):
    return HttpResponse("Witaj w Django!")
def hello_name(request, name):
    return HttpResponse(f"Witaj, {name}!")
from django.shortcuts import render

def hello_template(request, name):
    return render(request, "witaj/hello.html",
                                            {"name": name})

def time(request):
    now = datetime.now()
    formatted_time = now.strftime("%d.%m.%Y, Godzina: %H:%M")
    return render(request, "witaj/time.html", {"formatted_time": formatted_time})
