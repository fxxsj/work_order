from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("workorder", "0036_add_performance_indexes"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="tasklog",
            index=models.Index(
                fields=["log_type", "created_at"],
                name="tasklog_type_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="tasklog",
            index=models.Index(
                fields=["operator", "created_at"],
                name="tasklog_operator_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="tasklog",
            index=models.Index(
                fields=["task", "created_at"],
                name="tasklog_task_created_idx",
            ),
        ),
    ]
